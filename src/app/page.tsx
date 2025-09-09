"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { ChangeEvent } from "react";
import { parse, format, differenceInHours } from "date-fns";
import { UploadCloud, BarChart3, PieChart, LineChart, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataUploader } from "@/components/data-uploader";
import { Header } from "@/components/header";
import type { ServiceRequest, MappedColumn } from "@/types";
import { processData } from "@/lib/data-helpers";
import { getBottleneckAnalysis } from "@/lib/actions";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Pie, PieChart as RechartsPieChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const requiredColumns: MappedColumn[] = [
  "unique_key",
  "request_type",
  "created_date",
  "closed_date",
];

export default function Home() {
  const [serviceData, setServiceData] = useState<ServiceRequest[]>([]);
  const [rawFileContent, setRawFileContent] = useState<string>('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleDataLoaded = (data: ServiceRequest[], rawContent: string) => {
    setServiceData(data);
    setRawFileContent(rawContent);
    setIsDataLoaded(true);

    if (data.length > 0) {
      const dates = data.map(d => d.created_date.getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      setDateRange({ from: minDate, to: maxDate });
    }
  };

  const handleReset = () => {
    setServiceData([]);
    setRawFileContent('');
    setIsDataLoaded(false);
    setDateRange(undefined);
    setAnalysisResult(null);
    setAnalysisError(null);
  };
  
  const handleAiAnalysis = async () => {
    if (!rawFileContent) return;
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    const result = await getBottleneckAnalysis({ serviceRequestData: rawFileContent });
    if (result.analysis) {
      setAnalysisResult(result.analysis);
    } else {
      setAnalysisError(result.error || "An unknown error occurred.");
    }
    setIsLoadingAnalysis(false);
  };

  const filteredData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return serviceData;
    }
    return serviceData.filter(d => {
      const created = d.created_date;
      return created >= dateRange.from! && created <= dateRange.to!;
    });
  }, [serviceData, dateRange]);

  const { kpi, turnaroundData, typeDistributionData, volumeData } = useMemo(() => {
    return processData(filteredData);
  }, [filteredData]);
  
  const turnaroundChartConfig = {
    turnaround: { label: "Hours", color: "hsl(var(--primary))" },
  };
  
  const typeChartConfig = {
    requests: { label: "Requests" },
  };

  const volumeChartConfig = {
    count: { label: "Requests", color: "hsl(var(--primary))" },
  };

  if (!isDataLoaded) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <Header onReset={handleReset} isDataLoaded={isDataLoaded} />
        <DataUploader onDataLoaded={handleDataLoaded} requiredColumns={requiredColumns} />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header onReset={handleReset} isDataLoaded={isDataLoaded} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.totalRequests.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Turnaround</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.avgTurnaround.toFixed(1)} hours</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.openRequests.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed Requests</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.closedRequests.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Average Turnaround Time by Request Type</CardTitle>
              <CardDescription>Average time in hours to close a service request.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer config={turnaroundChartConfig} className="h-[300px] w-full">
                <BarChart data={turnaroundData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" dataKey="averageTurnaround" />
                  <YAxis type="category" dataKey="request_type" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                  <Bar dataKey="averageTurnaround" name="Average Turnaround (hours)" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Request Type Distribution</CardTitle>
              <CardDescription>Breakdown of service requests by type.</CardDescription>
            </CardHeader>
            <CardContent>
               <ChartContainer config={typeChartConfig} className="h-[300px] w-full">
                <RechartsPieChart>
                  <Tooltip content={<ChartTooltipContent nameKey="request_type" />} />
                  <Pie data={typeDistributionData} dataKey="count" nameKey="request_type" cx="50%" cy="50%" outerRadius={100} label>
                     {typeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </RechartsPieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-7">
             <CardHeader>
                <CardTitle>Request Volume Over Time</CardTitle>
                <CardDescription>Number of service requests created per month.</CardDescription>
             </CardHeader>
             <CardContent>
                <ChartContainer config={volumeChartConfig} className="h-[300px] w-full">
                  <BarChart data={volumeData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ChartContainer>
             </CardContent>
          </Card>
          
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>AI-Assisted Bottleneck Analysis</CardTitle>
              <CardDescription>Use AI to identify common causes for delays in service requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisResult && (
                 <div className="prose prose-sm dark:prose-invert max-w-full rounded-md border bg-muted/30 p-4">
                  <p className="whitespace-pre-wrap">{analysisResult}</p>
                 </div>
              )}
              {analysisError && (
                 <div className="prose prose-sm max-w-full rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
                   <p className="font-bold">Analysis Failed</p>
                   <p>{analysisError}</p>
                 </div>
              )}
              {!analysisResult && !analysisError && (
                <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-md">
                  <Button onClick={handleAiAnalysis} disabled={isLoadingAnalysis}>
                    {isLoadingAnalysis && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoadingAnalysis ? "Analyzing..." : "Run AI Analysis"}
                  </Button>
                </div>
              )}
               { (analysisResult || analysisError) && (
                 <Button onClick={handleAiAnalysis} disabled={isLoadingAnalysis} variant="outline" className="mt-4">
                    {isLoadingAnalysis && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoadingAnalysis ? "Re-analyzing..." : "Run Analysis Again"}
                 </Button>
               )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
