/** Operating expense categories are retained when deactivated. */
export interface StayExpenseCategory {
  id: string;
  name: string;
  active: boolean;
  version: number;
}

export interface StayExpense {
  id: string;
  buildingId: string;
  roomId: string | null;
  categoryId: string;
  amount: number;
  spentOn: string;
  period: string;
  note: string | null;
  receiptFileId: string | null;
  receipt: { url: string; expiresAt: string } | null;
  version: number;
}

export interface ExpenseCategoryTotal {
  categoryId: string;
  amount: number;
}
