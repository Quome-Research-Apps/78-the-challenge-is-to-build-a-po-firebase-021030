"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { MappedColumn } from "@/types";

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  headers: string[];
  requiredColumns: MappedColumn[];
  onMap: (mapping: Record<MappedColumn, string>) => void;
}

export function ColumnMappingModal({ isOpen, onClose, headers, requiredColumns, onMap }: ColumnMappingModalProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleSelectChange = (requiredCol: MappedColumn, headerCol: string) => {
    setMapping(prev => ({ ...prev, [requiredCol]: headerCol }));
  };

  const handleConfirm = () => {
    const missingCols = requiredColumns.filter(col => !mapping[col]);
    if (missingCols.length > 0) {
      setError(`Please map all required fields. Missing: ${missingCols.join(", ")}`);
      return;
    }
    setError(null);
    onMap(mapping as Record<MappedColumn, string>);
  };

  const getSuggestedMapping = (requiredCol: MappedColumn) => {
    const lowerCaseRequired = requiredCol.toLowerCase().replace(/_/g, '');
    return headers.find(h => h.toLowerCase().replace(/_/g, '') === lowerCaseRequired);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Map Data Columns</DialogTitle>
          <DialogDescription>
            Match the columns from your file to the required fields for analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {requiredColumns.map(col => (
            <div key={col} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={col} className="text-right capitalize">
                {col.replace(/_/g, " ")}
              </Label>
              <Select
                onValueChange={(value) => handleSelectChange(col, value)}
                defaultValue={getSuggestedMapping(col)}
              >
                <SelectTrigger id={col} className="col-span-3">
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(header => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right capitalize">
              Location
            </Label>
            <div className="col-span-3 text-xs text-muted-foreground">
              (Optional) Map Latitude & Longitude for geospatial analysis.
            </div>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="latitude" className="text-right capitalize">
                Latitude
              </Label>
              <Select
                onValueChange={(value) => handleSelectChange("latitude" as MappedColumn, value)}
                defaultValue={getSuggestedMapping("latitude" as MappedColumn)}
              >
                <SelectTrigger id="latitude" className="col-span-3">
                  <SelectValue placeholder="Select latitude (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(header => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="longitude" className="text-right capitalize">
                Longitude
              </Label>
              <Select
                onValueChange={(value) => handleSelectChange("longitude" as MappedColumn, value)}
                defaultValue={getSuggestedMapping("longitude" as MappedColumn)}
              >
                <SelectTrigger id="longitude" className="col-span-3">
                  <SelectValue placeholder="Select longitude (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(header => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Mapping Incomplete</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancel</Button>
          <Button onClick={handleConfirm}>Confirm Mapping</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
