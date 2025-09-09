export type ServiceRequest = {
  [key: string]: any;
  // Mapped fields
  unique_key: string;
  request_type: string;
  created_date: Date;
  closed_date: Date | null;
  latitude: number | null;
  longitude: number | null;
  turnaround_hours: number | null;
};

export type MappedColumn = 'unique_key' | 'request_type' | 'created_date' | 'closed_date' | 'latitude' | 'longitude';
