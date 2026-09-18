export type StateMeta = {
  name: string;
  plain?: string;
  ep: string;
  cap: string;
  a: string;
};

export const STATES: Record<string, StateMeta> = {
"jammu-kashmir":{name:"Jammu & Kashmir",plain:"Jammu & Kashmir",ep:"The vale",cap:"Srinagar / Jammu",a:"#7C93A8"},
"ladakh":{name:"Ladakh",ep:"High desert",cap:"Leh",a:"#93A0AB"},
"himachal-pradesh":{name:"Himachal Pradesh",ep:"Hill country",cap:"Shimla",a:"#5C8090"},
"punjab":{name:"Punjab",ep:"Five rivers",cap:"Chandigarh",a:"#B8813B"},
"haryana":{name:"Haryana",ep:"The plain",cap:"Chandigarh",a:"#A8894E"},
"delhi":{name:"Delhi",ep:"The capital",cap:"New Delhi",a:"#C24A46"},
"uttarakhand":{name:"Uttarakhand",ep:"Source of rivers",cap:"Dehradun",a:"#6E8A6A"},
"uttar-pradesh":{name:"Uttar Pradesh",ep:"The heartland",cap:"Lucknow",a:"#C05A2A"},
"rajasthan":{name:"Rajasthan",ep:"Desert kingdoms",cap:"Jaipur",a:"#D98A3B"},
"gujarat":{name:"Gujarat",ep:"The long coast",cap:"Gandhinagar",a:"#C9A227"},
"madhya-pradesh":{name:"Madhya Pradesh",ep:"The centre",cap:"Bhopal",a:"#8C6A3F"},
"chhattisgarh":{name:"Chhattisgarh",ep:"Forest and ore",cap:"Raipur",a:"#7B4B2A"},
"jharkhand":{name:"Jharkhand",ep:"The plateau",cap:"Ranchi",a:"#5E6B3A"},
"bihar":{name:"Bihar",ep:"River country",cap:"Patna",a:"#9C7B2E"},
"west-bengal":{name:"West Bengal",ep:"Delta and hills",cap:"Kolkata",a:"#2F5E7E"},
"sikkim":{name:"Sikkim",ep:"The ridge",cap:"Gangtok",a:"#5B8F7A"},
"assam":{name:"Assam",ep:"The Brahmaputra",cap:"Dispur",a:"#4A7A4A"},
"meghalaya":{name:"Meghalaya",ep:"Cloud plateau",cap:"Shillong",a:"#4E8070"},
"arunachal-pradesh":{name:"Arunachal Pradesh",ep:"First light",cap:"Itanagar",a:"#3E6E5E"},
"nagaland":{name:"Nagaland",ep:"The hills",cap:"Kohima",a:"#6A8F5E"},
"manipur":{name:"Manipur",ep:"The valley",cap:"Imphal",a:"#8A6E4A"},
"mizoram":{name:"Mizoram",ep:"Ridge villages",cap:"Aizawl",a:"#5E7F8A"},
"tripura":{name:"Tripura",ep:"Border country",cap:"Agartala",a:"#A0674A"},
"odisha":{name:"Odisha",ep:"Temple coast",cap:"Bhubaneswar",a:"#2E6F6B"},
"maharashtra":{name:"Maharashtra",ep:"Deccan and sea",cap:"Mumbai",a:"#A6322E"},
"goa":{name:"Goa",ep:"The small coast",cap:"Panaji",a:"#C08A4A"},
"karnataka":{name:"Karnataka",ep:"Plateau and shore",cap:"Bengaluru",a:"#B4603F"},
"telangana":{name:"Telangana",ep:"The high Deccan",cap:"Hyderabad",a:"#7A5C86"},
"andhra-pradesh":{name:"Andhra Pradesh",ep:"The eastern shore",cap:"Amaravati",a:"#6E7F3F"},
"tamil-nadu":{name:"Tamil Nadu",ep:"The south",cap:"Chennai",a:"#7E3A56"},
"kerala":{name:"Kerala",ep:"Backwater state",cap:"Thiruvananthapuram",a:"#3F7A55"},
"andaman-nicobar":{name:"Andaman & Nicobar",plain:"Andaman & Nicobar",ep:"Bay islands",cap:"Port Blair",a:"#3A6E80"},
"lakshadweep":{name:"Lakshadweep",ep:"Coral atolls",cap:"Kavaratti",a:"#4E8A8A"}
};

export const STATE_KEYS = Object.keys(STATES);
