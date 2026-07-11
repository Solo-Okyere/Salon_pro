// Moolre API client — payments (Collections) and SMS. https://docs.moolre.com/
const BASE_URL = process.env.MOOLRE_BASE_URL || "https://sandbox.moolre.com";
const API_USER = process.env.MOOLRE_API_USER || "";
const API_KEY = process.env.MOOLRE_API_KEY || "";
const VAS_KEY = process.env.MOOLRE_VAS_KEY || "";
const ACCOUNT_NUMBER = process.env.MOOLRE_ACCOUNT_NUMBER || "";
const SENDER_ID = process.env.MOOLRE_SENDER_ID || "";

// Moolre channel codes for mobile money networks
const CHANNEL_CODES: Record<string, string> = {
  MTN_MOMO: "13",
  TELECEL_CASH: "6",
  AT_MONEY: "7",
};

type MoolreResponse<T> = {
  status: number;
  code: string;
  message: string | null;
  data: T;
};

async function moolreRequest<T>(path: string, headers: Record<string, string>, body: unknown): Promise<MoolreResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok || json.status !== 1) {
    throw new Error(`Moolre request failed [${json.code ?? res.status}]: ${json.message ?? "Unknown error"}`);
  }
  return json as MoolreResponse<T>;
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
      payer: phone.replace(/^\+/, ""),
      amount: amount.toString(),
      externalref: reference,
      accountnumber: ACCOUNT_NUMBER,
    }
  );
}

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

export async function checkTransferStatus(reference: string) {
  return moolreRequest<TransferStatusData>(
    "/open/transact/status",
    { "X-API-USER": API_USER, "X-API-KEY": API_KEY },
    {
      type: 1,
      idtype: "1",
      id: reference,
      accountnumber: ACCOUNT_NUMBER,
    }
  );
}

export async function sendSms(to: string, message: string, ref?: string) {
  const recipient = to.replace(/^\+/, "").replace(/\s/g, "");
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

export const moolre = { initiatePayment, checkTransferStatus, sendSms };
