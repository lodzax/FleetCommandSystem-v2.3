import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  height?: number;
  width?: number;
  className?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({ value, height = 40, width = 140, className }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 1.5,
          height: 30,
          displayValue: false,
          margin: 4,
          background: 'transparent',
        });
      } catch {}
    }
  }, [value]);

  return (
    <svg ref={svgRef} className={className} style={{ width, height }} />
  );
};
