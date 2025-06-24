
import '@tanstack/react-table';

import type React from 'react';
declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends RowData, TValue> {
    header?: {
      style?: React.CSSProperties;
    },
    cell?: {
      style?: React.CSSProperties;
    }
  }
  interface TableState {
    isLoading?: boolean;
    isLoadingBenchmarks?: boolean;
  }
}
