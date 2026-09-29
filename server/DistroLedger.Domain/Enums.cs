namespace DistroLedger.Domain;

public enum PaymentStatus
{
    Unpaid = 0,
    Partial = 1,
    Paid = 2
}

public enum PaymentMethod
{
    Cash = 0,
    Bank = 1,
    Cheque = 2,
    Credit = 3,
    Other = 4
}
