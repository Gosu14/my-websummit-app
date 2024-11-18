import { Notifier, Ledger, JSON, Context, Crypto } from '@klave/sdk';
import { FetchInput, FetchOutput, StoreInput, StoreOutput, ErrorMessage } from './types';

const myTableName = "my_storage_table";

/**
 * @transaction
 */
export function trustedTime(): void 
{
    let time = Context.get("trusted_time");
    Notifier.sendString("trusted_time: " + time);
}

/**
 * @query
 */
export function ping(): void {
    Notifier.sendString("PONG");
}

/**
 * @query
 */
export function signature(): void {
    let eccKey = Crypto.Subtle.generateKey({namedCurve: "P-256"} as Crypto.EcKeyGenParams, true, ["sign", "verify"]);
    let data = String.UTF8.encode("Hello, World!", true);
    for (let i = 0; i < 5000; i++) {
        let signature = Crypto.Subtle.sign({hash: "SHA-256"} as Crypto.EcdsaParams, eccKey.data, data);
        let verified = Crypto.Subtle.verify({hash: "SHA-256"} as Crypto.EcdsaParams, eccKey.data, data, signature.data);
        if (verified.data) {
            let verification = verified.data as Crypto.SignatureVerification;
            if(!verification.isValid) {
                Notifier.sendString("Signature verification failed");
            }
        }
    }
    Notifier.sendString("Signature verification succeeded");
}

/**
 * @query
 */
export function echo(): void {
    let sender = Context.get("sender");
    Notifier.sendString("sender: " + sender);
    let caller = Context.get("caller");
    Notifier.sendString("caller: " + caller);
    let time = Context.get("trusted_time");
    Notifier.sendString("trusted_time: " + time);
}


/**
 * @query
 * @param {FetchInput} input - A parsed input argument
 */
export function fetchValue(input: FetchInput): void {

    let value = Ledger.getTable(myTableName).get(input.key);
    if (value.length === 0) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `key '${input.key}' not found in table`
        });
    } else {
        Notifier.sendJson<FetchOutput>({
            success: true,
            value
        });
    }
}

/**
 * @transaction
 * @param {StoreInput} input - A parsed input argument
 */
export function storeValue(input: StoreInput): void {

    if (input.key && input.value) {
        Ledger.getTable(myTableName).set(input.key, input.value);
        Notifier.sendJson<StoreOutput>({
            success: true
        });
        return;
    }

    Notifier.sendJson<ErrorMessage>({
        success: false,
        message: `Missing value arguments`
    });
}
