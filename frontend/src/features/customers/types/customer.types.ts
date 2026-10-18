export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  createdAt: string;
  lastVisit: string | null;
}

export interface CustomerInput {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
