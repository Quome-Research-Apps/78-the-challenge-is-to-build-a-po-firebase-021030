"use client";

import { useState, useCallback, type DragEvent, type ChangeEvent } from "react";
import { UploadCloud, FileJson, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ColumnMappingModal } from "@/components/column-mapping-modal";
import { parseCsv, parseJson, processAndValidateData } from "@/lib/data-helpers";
import type { ServiceRequest, MappedColumn } from "@/types";

interface DataUploaderProps {
  onDataLoaded: (data: ServiceRequest[], rawContent: string) => void;
  requiredColumns: MappedColumn[];
}

export function DataUploader({ onDataLoaded, requiredColumns }: DataUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileToMap, setFileToMap] = useState<{ content: string; type: "csv" | "json" } | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFile = useCallback((file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileType = file.type === "application/json" ? "json" : "csv";
      
      try {
        const { headers: parsedHeaders, data } = fileType === 'json' ? parseJson(content) : parseCsv(content);
        if (data.length === 0) {
          throw new Error("File is empty or could not be parsed.");
        }
        setHeaders(parsedHeaders);
        setFileToMap({ content, type: fileType });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Parsing Error",
          description: error instanceof Error ? error.message : "Could not read file.",
        });
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "File Error",
        description: "Could not read the selected file.",
      });
      setIsLoading(false);
    };
    reader.readAsText(file);
  }, [toast]);

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleMappingConfirm = (mapping: Record<MappedColumn, string>) => {
    if (!fileToMap) return;
    try {
        const rawData = fileToMap.type === 'csv' ? parseCsv(fileToMap.content).data : parseJson(fileToMap.content).data;
        const processed = processAndValidateData(rawData, mapping);
        onDataLoaded(processed, fileToMap.content);
        setFileToMap(null);
        setIsLoading(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Data Processing Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
      setIsLoading(false);
      setFileToMap(null);
    }
  };

  return (
    <div className="w-full max-w-2xl text-center">
      <div
        className={`relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
          isDragging ? "border-primary bg-primary/10" : "border-border"
        }`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Processing file...</p>
          </div>
        ) : (
          <>
            <UploadCloud className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Upload your 311 data</h3>
            <p className="mb-4 text-muted-foreground">Drag & drop a CSV or JSON file here</p>
            <input
              id="file-upload"
              type="file"
              className="sr-only"
              accept=".csv, application/vnd.ms-excel, .json"
              onChange={onFileChange}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Or browse files
            </label>
            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>CSV</span>
              </div>
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                <span>JSON</span>
              </div>
            </div>
          </>
        )}
      </div>
      {fileToMap && (
        <ColumnMappingModal
          isOpen={!!fileToMap}
          onClose={() => {
            setFileToMap(null);
            setIsLoading(false);
          }}
          headers={headers}
          requiredColumns={requiredColumns}
          onMap={handleMappingConfirm}
        />
      )}
    </div>
  );
}
