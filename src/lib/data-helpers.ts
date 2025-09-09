import { parse, isValid, differenceInHours, format } from "date-fns";
import type { ServiceRequest, MappedColumn } from "@/types";

// Simple CSV parser that handles quoted fields
export function parseCsv(csvText: string): { headers: string[], data: Record<string, string>[] } {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = lines.slice(1).map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const entry: Record<string, string> = {};
        headers.forEach((header, index) => {
            entry[header] = values[index]?.trim().replace(/^"|"$/g, '') || '';
        });
        return entry;
    });
    return { headers, data };
}

export function parseJson(jsonText: string): { headers: string[], data: Record<string, any>[] } {
    const data = JSON.parse(jsonText);
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("JSON must be an array of objects.");
    }
    const headers = Object.keys(data[0]);
    return { headers, data };
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Try to parse ISO format first, then common US formats
  const formats = [
    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
    "MM/dd/yyyy hh:mm:ss a",
    "MM/dd/yyyy",
    "yyyy-MM-dd",
  ];
  for (const fmt of formats) {
    const parsed = parse(dateStr, fmt, new Date());
    if (isValid(parsed)) return parsed;
  }
  const genericParsed = new Date(dateStr);
  return isValid(genericParsed) ? genericParsed : null;
}

export function processAndValidateData(
  rawData: Record<string, any>[],
  columnMap: Record<MappedColumn, string>
): ServiceRequest[] {
  return rawData.map((rawRow, index) => {
    const createdDate = parseDate(rawRow[columnMap.created_date]);
    if (!createdDate) {
      throw new Error(`Invalid 'created_date' at row ${index + 2}. Could not parse value: ${rawRow[columnMap.created_date]}`);
    }

    const closedDateRaw = rawRow[columnMap.closed_date];
    const closedDate = closedDateRaw ? parseDate(closedDateRaw) : null;
    
    const turnaroundHours = closedDate ? differenceInHours(closedDate, createdDate) : null;
    
    return {
      ...rawRow,
      unique_key: rawRow[columnMap.unique_key] || `gen_${index}`,
      request_type: rawRow[columnMap.request_type] || "Unknown",
      created_date: createdDate,
      closed_date: closedDate,
      latitude: parseFloat(rawRow[columnMap.latitude]) || null,
      longitude: parseFloat(rawRow[columnMap.longitude]) || null,
      turnaround_hours: turnaroundHours !== null && turnaroundHours >= 0 ? turnaroundHours : null,
    };
  });
}

export function processData(data: ServiceRequest[]) {
  const totalRequests = data.length;
  const closedRequestsData = data.filter(d => d.turnaround_hours !== null);
  const totalTurnaround = closedRequestsData.reduce((acc, d) => acc + (d.turnaround_hours || 0), 0);
  const avgTurnaround = closedRequestsData.length > 0 ? totalTurnaround / closedRequestsData.length : 0;
  
  const kpi = {
    totalRequests,
    avgTurnaround,
    openRequests: totalRequests - closedRequestsData.length,
    closedRequests: closedRequestsData.length,
  };

  const turnaroundByType = data.reduce((acc, d) => {
    if (d.turnaround_hours !== null) {
      if (!acc[d.request_type]) {
        acc[d.request_type] = { totalHours: 0, count: 0 };
      }
      acc[d.request_type].totalHours += d.turnaround_hours;
      acc[d.request_type].count++;
    }
    return acc;
  }, {} as Record<string, { totalHours: number, count: number }>);

  const turnaroundData = Object.entries(turnaroundByType)
    .map(([type, { totalHours, count }]) => ({
      request_type: type,
      averageTurnaround: count > 0 ? parseFloat((totalHours / count).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.averageTurnaround - a.averageTurnaround)
    .slice(0, 10);

  const typeDistribution = data.reduce((acc, d) => {
    acc[d.request_type] = (acc[d.request_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const typeDistributionData = Object.entries(typeDistribution)
    .map(([type, count]) => ({ request_type: type, count }))
    .sort((a, b) => b.count - a.count);

  const volumeByMonth = data.reduce((acc, d) => {
    const month = format(d.created_date, 'yyyy-MM');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const volumeData = Object.entries(volumeByMonth)
    .map(([month, count]) => ({ month: format(new Date(month), 'MMM yy'), count }))
    .sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  return { kpi, turnaroundData, typeDistributionData, volumeData };
}
