/**
 * Which states a PIN code can belong to.
 *
 * The first two digits of an Indian PIN code name the postal circle, and each
 * circle covers one state or a small group of neighbours. The table is
 * deliberately generous where a circle straddles a border or covers a union
 * territory the state list does not offer (Chandigarh, Ladakh, the islands):
 * the point is to catch a Delhi PIN with a Tamil Nadu address, never to turn
 * away a real one.
 *
 * Source: India Post's PIN code zones.
 */

type States = readonly string[];

const UP_UK: States = ["Uttar Pradesh", "Uttarakhand"];
const BIHAR_JH: States = ["Bihar", "Jharkhand"];
const NORTH_EAST: States = [
  "Assam",
  "Arunachal Pradesh",
  "Meghalaya",
  "Manipur",
  "Mizoram",
  "Nagaland",
  "Tripura",
];

const BY_PREFIX: Record<string, States> = {
  "11": ["Delhi"],
  "12": ["Haryana"],
  "13": ["Haryana"],
  "14": ["Punjab"],
  "15": ["Punjab"],
  // 160 is Chandigarh, which is not in the state list.
  "16": ["Punjab", "Haryana"],
  "17": ["Himachal Pradesh"],
  // 194 is Ladakh, which is not in the state list.
  "18": ["Jammu and Kashmir"],
  "19": ["Jammu and Kashmir"],
  "20": UP_UK, "21": UP_UK, "22": UP_UK, "23": UP_UK, "24": UP_UK,
  "25": UP_UK, "26": UP_UK, "27": UP_UK, "28": UP_UK,
  "30": ["Rajasthan"], "31": ["Rajasthan"], "32": ["Rajasthan"], "33": ["Rajasthan"], "34": ["Rajasthan"],
  "36": ["Gujarat"], "37": ["Gujarat"], "38": ["Gujarat"], "39": ["Gujarat"],
  "40": ["Maharashtra", "Goa"],
  "41": ["Maharashtra"], "42": ["Maharashtra"], "43": ["Maharashtra"], "44": ["Maharashtra"],
  "45": ["Madhya Pradesh"], "46": ["Madhya Pradesh"], "47": ["Madhya Pradesh"], "48": ["Madhya Pradesh"],
  "49": ["Chhattisgarh"],
  "50": ["Telangana"],
  "51": ["Andhra Pradesh"], "52": ["Andhra Pradesh"],
  // 533 includes Yanam, part of Puducherry.
  "53": ["Andhra Pradesh", "Puducherry"],
  "56": ["Karnataka"], "57": ["Karnataka"], "58": ["Karnataka"], "59": ["Karnataka"],
  // 605, 607 and 609 are Puducherry and Karaikal.
  "60": ["Tamil Nadu", "Puducherry"], "61": ["Tamil Nadu"], "62": ["Tamil Nadu"],
  "63": ["Tamil Nadu"], "64": ["Tamil Nadu"],
  // 673 includes Mahe (Puducherry); 682 includes Lakshadweep.
  "67": ["Kerala", "Puducherry"], "68": ["Kerala"], "69": ["Kerala"],
  "70": ["West Bengal"], "71": ["West Bengal"], "72": ["West Bengal"],
  "73": ["West Bengal", "Sikkim"],
  "74": ["West Bengal"],
  "75": ["Odisha"], "76": ["Odisha"], "77": ["Odisha"],
  "78": ["Assam"],
  "79": NORTH_EAST,
  "80": BIHAR_JH, "81": BIHAR_JH, "82": BIHAR_JH, "83": BIHAR_JH, "84": BIHAR_JH, "85": BIHAR_JH,
};

/**
 * The states a PIN code may be in, or null when any state is acceptable:
 * army and field post offices (9xxxxx), the Andaman and Nicobar Islands
 * (744xxx), and prefixes this table does not know.
 */
export function statesForPinCode(pinCode: string): States | null {
  if (!/^[1-9]\d{5}$/.test(pinCode)) return null;
  if (pinCode.startsWith("744")) return null;
  return BY_PREFIX[pinCode.slice(0, 2)] ?? null;
}

/** True when the PIN code could belong to the state (case-insensitive). */
export function pinCodeMatchesState(pinCode: string, state: string): boolean {
  const states = statesForPinCode(pinCode);
  if (!states) return true;
  const wanted = state.trim().toLowerCase();
  return states.some((entry) => entry.toLowerCase() === wanted);
}
