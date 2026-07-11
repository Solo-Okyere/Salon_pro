// Moolre API client — payments (Collections), disbursements, and SMS. https://docs.moolre.com/
const BASE_URL = process.env.MOOLRE_BASE_URL || "https://sandbox.moolre.com";
const API_USER = process.env.MOOLRE_API_USER || "";
const API_KEY = process.env.MOOLRE_API_KEY || "";
const VAS_KEY = process.env.MOOLRE_VAS_KEY || "";
const ACCOUNT_NUMBER = process.env.MOOLRE_ACCOUNT_NUMBER || "";
const SENDER_ID = process.env.MOOLRE_SENDER_ID || "";

const CHANNEL_CODES: Record<string, string> = {
  MTN_MOMO: "13",
  TELECEL_CASH: "6",
  AT_MONEY: "7",
};

const DISBURSEMENT_CHANNEL_CODES: Record<string, string> = {
  MTN: "1",
  TELECEL: "6",
  AT: "7",
};

type MoolreResponse<T> = {
  status: number | string;
  code: string;
  message: string | null;
  data: T;
};

type TransferStatusData = {
  txstatus: number;
  txtype: number;
  accountnumber: string;
  payee: string;
  amount: string;
  transactionid: string;
  externalref: string;
  ts: string;
};

type AccountStatusData = {
  balance: number | string;
  accountname?: string;
  callback?: string;
};

type ValidationNameData = string | { name?: string; receiverName?: string; receiver?: string };

type TransferData = {
  txstatus?: number;
  txtype?: number;
  accountnumber?: string;
  payee?: string;
  amount?: string;
  transactionid?: string;
  externalref?: string;
  receivername?: string;
  receiver?: string;
};

function normalizePhone(phone: string) {
  return phone.replace(/^\+/, "").replace(/\s+/g, "");
}

async function moolreRequest<T>(path: string, headers: Record<string, string>, body: unknown): Promise<MoolreResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }

  const parsed = json as Partial<MoolreResponse<T>>;
  const success = res.ok && (parsed.status === 1 || parsed.status === "1");
  if (!success) {
    const message = parsed.message ?? "Unknown error";
    const fallback = typeof message === "string" ? message : "Unknown error";
    throw new Error(`Moolre request failed [${parsed.code ?? res.status}]: ${fallback}`);
  }

  return parsed as MoolreResponse<T>;
}

export async function initiatePayment(
  provider: "MTN_MOMO" | "TELECEL_CASH" | "AT_MONEY",
  amount: number,
  phone: string,
  reference: string
) {
  const channel = CHANNEL_CODES[provider];
  if (!channel) throw new Error(`Unsupported payment provider: ${provider}`);

  return moolreRequest<string>(
    "/open/transact/payment",
    { "X-API-USER": API_USER, "X-API-KEY": API_KEY },
    {
      type: 1,
      channel,
      currency: "GHS",
      payer: normalizePhone(phone),
      amount: amount.toString(),
      externalref: reference,
      accountnumber: ACCOUNT_NUMBER,
    }
  );
}

export async function checkAccountStatus() {
  return moolreRequest<AccountStatusData>(
    "/open/account/status",
    { "X-API-USER": API_USER, "X-API-KEY": API_KEY },
    {
      type: 1,
      accountnumber: ACCOUNT_NUMBER,
    }
  );
}

export async function validateRecipientName(receiver: string, channel: "MTN" | "TELECEL" | "AT", currency = "GHS") {
  const mappedChannel = DISBURSEMENT_CHANNEL_CODES[channel];
  if (!mappedChannel) throw new Error(`Unsupported disbursement channel: ${channel}`);

  return moolreRequest<ValidationNameData>(
    "/open/transact/validate",
    { "X-API-USER": API_USER, "X-API-KEY": API_KEY },
    {
      type: 1,
      receiver: normalizePhone(receiver),
      channel: mappedChannel,
      sublistid: "",
      currency,
      accountnumber: ACCOUNT_NUMBER,
    }
  );
}

export async function initiateTransfer(
  amount: number,
  phone: string,
  reference: string,
  channel: "MTN" | "TELECEL" | "AT",
  description = "SalonPro payout"
) {
  const mappedChannel = DISBURSEMENT_CHANNEL_CODES[channel];
  if (!mappedChannel) throw new Error(`Unsupported disbursement channel: ${channel}`);

  return moolreRequest<TransferData>(
    "/open/transact/transfer",
    { "X-API-USER": API_USER, "X-API-KEY": API_KEY },
    {
      type: 1,
      channel: mappedChannel,
      currency: "GHS",
      amount: amount.toString(),
      receiver: normalizePhone(phone),
      sublistid: "",
      externalref: reference,
      reference: description,
      accountnumber: ACCOUNT_NUMBER,
    }
  );
}

export async function checkTransferStatus(reference: string) {
  return moolreRequest<TransferStatusData>(
    "/open/transact/status",
    { "X-API-USER": API_USER, "X-API-KEY": API_KEY },
    {
      type: 1,
      idtype: "externalref",
      id: reference,
      accountnumber: ACCOUNT_NUMBER,
    }
  );
}

export async function sendSms(to: string, message: string, ref?: string) {
  const recipient = normalizePhone(to).replace(/^\+/, "").replace(/\s/g, "");
  return moolreRequest<null>(
    "/open/sms/send",
    { "X-Api-VasKey": VAS_KEY },
    {
      type: 1,
      senderid: SENDER_ID,
      messages: [{ recipient, message, ...(ref ? { ref } : {}) }],
    }
  );
}

export const moolre = {
  initiatePayment,
  checkAccountStatus,
  validateRecipientName,
  initiateTransfer,
  checkTransferStatus,
  sendSms,
};
