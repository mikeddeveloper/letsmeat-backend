// Mirrors apps/web-next's src/lib/data/catalog.ts — copied rather than
// imported since the two are separate projects with no shared package yet.
// Keep these in sync manually until the catalog has one real source of truth.

export type CatalogPart = {
  slug: string;
  name: string;
  basePrice: number; // NGN (whole naira, converted to kobo at seed time)
  unit: "kg" | "unit";
  conditions: Array<"fresh" | "frozen">;
  processing: string[];
  availability?: "in_stock" | "limited" | "out_of_stock";
};

export type CatalogAnimal = {
  slug: string;
  name: string;
  description: string;
  parts: CatalogPart[];
};

export type CatalogCategory = {
  slug: string;
  name: string;
  description: string;
  animals: CatalogAnimal[];
};

const standardConditions: Array<"fresh" | "frozen"> = ["fresh", "frozen"];

export const catalogCategories: CatalogCategory[] = [
  {
    slug: "poultry",
    name: "Poultry",
    description: "Farm-raised poultry with multiple cut and processing options.",
    animals: [
      {
        slug: "chicken",
        name: "Chicken",
        description: "Everyday poultry favorite.",
        parts: [
          { slug: "whole", name: "Whole Chicken", basePrice: 4800, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned", "smoked"], availability: "in_stock" },
          { slug: "neck", name: "Chicken Neck", basePrice: 900, unit: "kg", conditions: standardConditions, processing: ["whole", "regular cut"], availability: "in_stock" },
          { slug: "breast", name: "Chicken Breast", basePrice: 5200, unit: "kg", conditions: standardConditions, processing: ["regular cut", "boneless", "diced", "sliced"], availability: "in_stock" },
          { slug: "wings", name: "Chicken Wings", basePrice: 4500, unit: "kg", conditions: standardConditions, processing: ["regular cut", "whole"], availability: "in_stock" },
          { slug: "thigh", name: "Chicken Thigh", basePrice: 5000, unit: "kg", conditions: standardConditions, processing: ["regular cut", "boneless", "diced"], availability: "limited" },
          { slug: "drumstick", name: "Chicken Drumstick", basePrice: 4700, unit: "kg", conditions: standardConditions, processing: ["regular cut", "whole"], availability: "in_stock" },
          { slug: "back", name: "Chicken Back", basePrice: 1200, unit: "kg", conditions: standardConditions, processing: ["whole", "regular cut"] },
          { slug: "feet", name: "Chicken Feet", basePrice: 1400, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned"] },
          { slug: "head", name: "Chicken Head", basePrice: 800, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned"] },
        ],
      },
      {
        slug: "turkey",
        name: "Turkey",
        description: "Larger premium poultry cuts.",
        parts: [
          { slug: "whole", name: "Whole Turkey", basePrice: 7000, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned", "smoked"] },
          { slug: "breast", name: "Turkey Breast", basePrice: 7600, unit: "kg", conditions: standardConditions, processing: ["boneless", "sliced", "regular cut"] },
          { slug: "drumstick", name: "Turkey Drumstick", basePrice: 6800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "whole"] },
        ],
      },
      {
        slug: "duck",
        name: "Duck",
        description: "Rich flavor duck options.",
        parts: [
          { slug: "whole", name: "Whole Duck", basePrice: 8200, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned"] },
          { slug: "breast", name: "Duck Breast", basePrice: 9000, unit: "kg", conditions: standardConditions, processing: ["boneless", "sliced"] },
        ],
      },
      {
        slug: "quail",
        name: "Quail",
        description: "Small premium birds.",
        parts: [{ slug: "whole", name: "Whole Quail", basePrice: 9500, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned"] }],
      },
      {
        slug: "guinea-fowl",
        name: "Guinea Fowl",
        description: "Lean and flavorful.",
        parts: [{ slug: "whole", name: "Whole Guinea Fowl", basePrice: 8600, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned", "smoked"] }],
      },
    ],
  },
  {
    slug: "red-meat",
    name: "Red Meat",
    description: "Classic red meat selections for daily and premium cooking.",
    animals: [
      {
        slug: "beef", name: "Beef", description: "Premium and standard beef cuts.", parts: [
          { slug: "neck", name: "Beef Neck", basePrice: 4500, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"], availability: "in_stock" },
          { slug: "chuck", name: "Chuck", basePrice: 5200, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"], availability: "in_stock" },
          { slug: "rib", name: "Rib", basePrice: 9800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced", "boneless", "cubed"], availability: "in_stock" },
          { slug: "short-loin", name: "Short Loin", basePrice: 12500, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced"], availability: "limited" },
          { slug: "sirloin", name: "Sirloin", basePrice: 10500, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced", "cubed"], availability: "limited" },
          { slug: "round", name: "Round", basePrice: 6200, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"], availability: "in_stock" },
          { slug: "flank", name: "Flank", basePrice: 7800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced"] },
          { slug: "plate", name: "Plate", basePrice: 6800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced"] },
          { slug: "brisket", name: "Brisket", basePrice: 9200, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced", "smoked"], availability: "in_stock" },
          { slug: "foreshank", name: "Foreshank", basePrice: 3400, unit: "kg", conditions: standardConditions, processing: ["regular cut", "cubed"] },
          { slug: "hindshank", name: "Hindshank", basePrice: 3600, unit: "kg", conditions: standardConditions, processing: ["regular cut", "cubed"] },
          { slug: "head", name: "Beef Head", basePrice: 2200, unit: "kg", conditions: standardConditions, processing: ["regular cut", "cleaned"] },
          { slug: "oxtail", name: "Oxtail", basePrice: 3800, unit: "kg", conditions: standardConditions, processing: ["whole", "regular cut"] },
          { slug: "hide", name: "Beef Hide", basePrice: 1200, unit: "kg", conditions: standardConditions, processing: ["whole"] },
        ],
      },
      {
        slug: "goat-meat", name: "Goat Meat", description: "Popular in local stews and grills.", parts: [
          { slug: "neck", name: "Goat Neck", basePrice: 3800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"] },
          { slug: "shoulder", name: "Goat Shoulder", basePrice: 6200, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced", "minced"] },
          { slug: "rack", name: "Goat Rack", basePrice: 7400, unit: "kg", conditions: standardConditions, processing: ["regular cut", "boneless"] },
          { slug: "loin", name: "Goat Loin", basePrice: 7900, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced"] },
          { slug: "leg", name: "Goat Leg", basePrice: 6500, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced", "cubed", "minced"], availability: "in_stock" },
          { slug: "flank", name: "Goat Flank", basePrice: 5400, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"] },
          { slug: "breast", name: "Goat Breast", basePrice: 5100, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"] },
          { slug: "shank", name: "Goat Shank", basePrice: 4800, unit: "kg", conditions: standardConditions, processing: ["whole", "regular cut"] },
        ],
      },
      {
        slug: "lamb", name: "Lamb", description: "Tender lamb cuts.", parts: [
          { slug: "neck", name: "Lamb Neck", basePrice: 5200, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"] },
          { slug: "shoulder", name: "Lamb Shoulder", basePrice: 8600, unit: "kg", conditions: standardConditions, processing: ["regular cut", "boneless"] },
          { slug: "rack", name: "Lamb Rack", basePrice: 13800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "boneless"] },
          { slug: "chops", name: "Lamb Chops", basePrice: 9800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "boneless", "cubed"] },
          { slug: "leg", name: "Lamb Leg", basePrice: 9200, unit: "kg", conditions: standardConditions, processing: ["regular cut", "boneless"] },
          { slug: "flank", name: "Lamb Flank", basePrice: 6800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"] },
          { slug: "breast", name: "Lamb Breast", basePrice: 6200, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"] },
          { slug: "shank", name: "Lamb Shank", basePrice: 7600, unit: "kg", conditions: standardConditions, processing: ["whole", "regular cut"] },
        ],
      },
      {
        slug: "mutton", name: "Mutton", description: "Mature sheep meat options.", parts: [
          { slug: "neck", name: "Mutton Neck", basePrice: 4000, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"] },
          { slug: "shoulder", name: "Mutton Shoulder", basePrice: 6800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"] },
          { slug: "rack", name: "Mutton Rack", basePrice: 8900, unit: "kg", conditions: standardConditions, processing: ["regular cut", "boneless"] },
          { slug: "loin", name: "Mutton Loin", basePrice: 7600, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced"] },
          { slug: "leg", name: "Mutton Leg", basePrice: 7300, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced", "cubed"] },
          { slug: "flank", name: "Mutton Flank", basePrice: 5600, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"] },
          { slug: "breast", name: "Mutton Breast", basePrice: 5300, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"] },
          { slug: "shank", name: "Mutton Shank", basePrice: 5900, unit: "kg", conditions: standardConditions, processing: ["whole", "regular cut"] },
        ],
      },
      { slug: "veal", name: "Veal", description: "Young beef cuts.", parts: [{ slug: "loin", name: "Veal Loin", basePrice: 12000, unit: "kg", conditions: standardConditions, processing: ["regular cut", "boneless", "sliced"] }] },
      {
        slug: "pork", name: "Pork", description: "Fresh and smoked pork selections.", parts: [
          { slug: "shoulder", name: "Pork Shoulder", basePrice: 7600, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced", "cubed"], availability: "in_stock" },
          { slug: "loin", name: "Pork Loin", basePrice: 8400, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced", "boneless"], availability: "in_stock" },
          { slug: "belly", name: "Pork Belly", basePrice: 7800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced", "smoked"], availability: "limited" },
          { slug: "ham", name: "Pork Ham", basePrice: 8100, unit: "kg", conditions: standardConditions, processing: ["regular cut", "smoked", "sliced"], availability: "in_stock" },
        ],
      },
      {
        slug: "rabbit", name: "Rabbit", description: "Lean specialty meat.", parts: [
          { slug: "whole", name: "Whole Rabbit", basePrice: 10200, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned", "regular cut"], availability: "in_stock" },
          { slug: "saddle", name: "Rabbit Saddle", basePrice: 12500, unit: "kg", conditions: standardConditions, processing: ["boneless", "regular cut"] },
          { slug: "hind-leg", name: "Rabbit Hind Leg", basePrice: 10800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "whole"] },
          { slug: "foreleg", name: "Rabbit Foreleg", basePrice: 8600, unit: "kg", conditions: standardConditions, processing: ["regular cut", "whole"] },
        ],
      },
    ],
  },
  {
    slug: "seafood",
    name: "Seafood",
    description: "Shellfish and ocean proteins.",
    animals: [
      { slug: "shrimp", name: "Shrimp", description: "Premium shrimp packs.", parts: [{ slug: "whole", name: "Whole Shrimp", basePrice: 14000, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned", "deveined", "shelled"] }] },
      { slug: "prawn", name: "Prawn", description: "Large prawns for grills and curries.", parts: [{ slug: "whole", name: "Whole Prawn", basePrice: 15000, unit: "kg", conditions: standardConditions, processing: ["whole", "deveined", "shelled"] }] },
      { slug: "crab", name: "Crab", description: "Fresh crab sections.", parts: [{ slug: "whole", name: "Whole Crab", basePrice: 15500, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned"] }] },
      { slug: "lobster", name: "Lobster", description: "Premium lobster tails and whole.", parts: [{ slug: "tail", name: "Lobster Tail", basePrice: 22000, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned", "shelled"] }] },
      { slug: "oyster", name: "Oyster", description: "Oyster packs.", parts: [{ slug: "whole", name: "Whole Oyster", basePrice: 13000, unit: "kg", conditions: standardConditions, processing: ["whole", "shelled"] }] },
      { slug: "mussels", name: "Mussels", description: "Shell-on and shell-off mussels.", parts: [{ slug: "whole", name: "Whole Mussels", basePrice: 12000, unit: "kg", conditions: standardConditions, processing: ["whole", "shelled", "cleaned"] }] },
      { slug: "clams", name: "Clams", description: "Fresh clams for soups.", parts: [{ slug: "whole", name: "Whole Clams", basePrice: 11000, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned", "shelled"] }] },
      { slug: "squid", name: "Squid", description: "Whole squid and rings.", parts: [{ slug: "whole", name: "Whole Squid", basePrice: 12500, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned", "sliced"] }] },
      { slug: "octopus", name: "Octopus", description: "Tentacle cuts and whole.", parts: [{ slug: "tentacle", name: "Octopus Tentacle", basePrice: 14500, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced", "whole"] }] },
      { slug: "scallops", name: "Scallops", description: "Premium scallops.", parts: [{ slug: "meat", name: "Scallop Meat", basePrice: 17500, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned"] }] },
    ],
  },
  {
    slug: "fish",
    name: "Fish",
    description: "Freshwater and ocean fish with multiple cut styles.",
    animals: [
      { slug: "catfish", name: "Catfish", description: "Classic local favorite.", parts: [{ slug: "whole", name: "Whole Catfish", basePrice: 6000, unit: "kg", conditions: standardConditions, processing: ["whole", "gutted", "cleaned", "smoked"] }, { slug: "fillet", name: "Catfish Fillet", basePrice: 7000, unit: "kg", conditions: standardConditions, processing: ["filleted", "sliced"] }] },
      { slug: "tilapia", name: "Tilapia", description: "Mild white fish.", parts: [{ slug: "whole", name: "Whole Tilapia", basePrice: 5600, unit: "kg", conditions: standardConditions, processing: ["whole", "gutted", "cleaned"] }] },
      { slug: "salmon", name: "Salmon", description: "Imported premium fish.", parts: [{ slug: "fillet", name: "Salmon Fillet", basePrice: 18500, unit: "kg", conditions: standardConditions, processing: ["filleted", "sliced", "smoked"] }] },
      { slug: "tuna", name: "Tuna", description: "Steak and fillet cuts.", parts: [{ slug: "steak", name: "Tuna Steak", basePrice: 15000, unit: "kg", conditions: standardConditions, processing: ["regular cut", "filleted", "sliced"] }] },
      { slug: "croaker", name: "Croaker", description: "Popular smoked fish option.", parts: [{ slug: "whole", name: "Whole Croaker", basePrice: 8800, unit: "kg", conditions: standardConditions, processing: ["whole", "gutted", "smoked"] }] },
      { slug: "hake", name: "Hake", description: "Mild fish for soups and fry.", parts: [{ slug: "fillet", name: "Hake Fillet", basePrice: 9800, unit: "kg", conditions: standardConditions, processing: ["filleted", "sliced"] }] },
      { slug: "mackerel", name: "Mackerel", description: "Rich oily fish.", parts: [{ slug: "whole", name: "Whole Mackerel", basePrice: 7600, unit: "kg", conditions: standardConditions, processing: ["whole", "gutted", "smoked"] }] },
      { slug: "sardine", name: "Sardine", description: "Small fish packs.", parts: [{ slug: "whole", name: "Whole Sardine", basePrice: 5200, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned"] }] },
      { slug: "snapper", name: "Snapper", description: "Premium red snapper cuts.", parts: [{ slug: "whole", name: "Whole Snapper", basePrice: 9600, unit: "kg", conditions: standardConditions, processing: ["whole", "gutted", "filleted"] }] },
      { slug: "barracuda", name: "Barracuda", description: "Firm fish for steaks.", parts: [{ slug: "steak", name: "Barracuda Steak", basePrice: 9000, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced"] }] },
      { slug: "cod", name: "Cod", description: "White fish fillet.", parts: [{ slug: "fillet", name: "Cod Fillet", basePrice: 14200, unit: "kg", conditions: standardConditions, processing: ["filleted", "sliced"] }] },
      { slug: "trout", name: "Trout", description: "Premium whole or fillet trout.", parts: [{ slug: "fillet", name: "Trout Fillet", basePrice: 13500, unit: "kg", conditions: standardConditions, processing: ["filleted", "sliced", "smoked"] }] },
    ],
  },
  {
    slug: "eggs",
    name: "Eggs",
    description: "Unit-priced eggs with flexible pack sizing.",
    animals: [
      {
        slug: "chicken-eggs", name: "Chicken Eggs", description: "Everyday egg packs.", parts: [
          { slug: "per-piece", name: "Single Egg", basePrice: 120, unit: "unit", conditions: ["fresh"], processing: ["whole"] },
          { slug: "half-dozen", name: "Half Dozen", basePrice: 650, unit: "unit", conditions: ["fresh"], processing: ["whole"] },
          { slug: "dozen", name: "Dozen", basePrice: 1250, unit: "unit", conditions: ["fresh"], processing: ["whole"] },
          { slug: "crate", name: "Crate", basePrice: 5200, unit: "unit", conditions: ["fresh"], processing: ["whole"] },
        ],
      },
      { slug: "turkey-eggs", name: "Turkey Eggs", description: "Large premium eggs.", parts: [{ slug: "dozen", name: "Dozen", basePrice: 2100, unit: "unit", conditions: ["fresh"], processing: ["whole"] }] },
      { slug: "quail-eggs", name: "Quail Eggs", description: "Small specialty eggs.", parts: [{ slug: "dozen", name: "Dozen", basePrice: 1700, unit: "unit", conditions: ["fresh"], processing: ["whole"] }] },
      { slug: "duck-eggs", name: "Duck Eggs", description: "Rich duck egg options.", parts: [{ slug: "dozen", name: "Dozen", basePrice: 1900, unit: "unit", conditions: ["fresh"], processing: ["whole"] }] },
    ],
  },
  {
    slug: "processed-specialty-meats",
    name: "Processed / Specialty Meats",
    description: "Ready-to-cook specialty proteins.",
    animals: [
      { slug: "sausage", name: "Sausage", description: "Seasoned sausage variants.", parts: [{ slug: "pack", name: "Sausage Pack", basePrice: 4800, unit: "unit", conditions: standardConditions, processing: ["whole", "smoked"] }] },
      { slug: "bacon", name: "Bacon", description: "Smoked and sliced bacon.", parts: [{ slug: "sliced", name: "Bacon Slices", basePrice: 10200, unit: "kg", conditions: standardConditions, processing: ["sliced", "smoked"] }] },
      { slug: "ham", name: "Ham", description: "Cured ham cuts.", parts: [{ slug: "regular", name: "Ham Cut", basePrice: 9600, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced", "smoked"] }] },
      { slug: "minced-meat", name: "Minced Meat", description: "Pre-minced protein options.", parts: [{ slug: "pack", name: "Minced Meat Pack", basePrice: 7600, unit: "kg", conditions: standardConditions, processing: ["minced"] }] },
      { slug: "smoked-turkey", name: "Smoked Turkey", description: "Ready smoked turkey.", parts: [{ slug: "whole", name: "Smoked Turkey Whole", basePrice: 8200, unit: "kg", conditions: ["frozen"], processing: ["smoked", "whole"] }] },
      { slug: "smoked-chicken", name: "Smoked Chicken", description: "Ready smoked chicken.", parts: [{ slug: "whole", name: "Smoked Chicken Whole", basePrice: 6500, unit: "kg", conditions: ["frozen"], processing: ["smoked", "whole"] }] },
      { slug: "smoked-fish", name: "Smoked Fish", description: "Smoked fish variants.", parts: [{ slug: "whole", name: "Smoked Fish Whole", basePrice: 9200, unit: "kg", conditions: ["frozen"], processing: ["smoked", "whole"] }] },
      { slug: "deli-cuts", name: "Deli Cuts", description: "Sliced deli products.", parts: [{ slug: "sliced", name: "Deli Sliced Pack", basePrice: 5300, unit: "unit", conditions: standardConditions, processing: ["sliced"] }] },
    ],
  },
  {
    slug: "organ-offals",
    name: "Organ Meats / Offals",
    description: "Nutrient-rich organ selections.",
    animals: [
      { slug: "beef-liver", name: "Beef Liver", description: "Fresh beef liver.", parts: [{ slug: "regular", name: "Beef Liver Cut", basePrice: 4200, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced", "cubed"] }] },
      { slug: "goat-liver", name: "Goat Liver", description: "Tender goat liver.", parts: [{ slug: "regular", name: "Goat Liver Cut", basePrice: 3900, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced", "cubed"] }] },
      { slug: "chicken-liver", name: "Chicken Liver", description: "Chicken liver packs.", parts: [{ slug: "pack", name: "Chicken Liver Pack", basePrice: 3300, unit: "kg", conditions: standardConditions, processing: ["regular cut", "whole"] }] },
      { slug: "kidney", name: "Kidney", description: "Kidney selections.", parts: [{ slug: "regular", name: "Kidney Cut", basePrice: 3600, unit: "kg", conditions: standardConditions, processing: ["regular cut", "sliced"] }] },
      { slug: "heart", name: "Heart", description: "Heart portions.", parts: [{ slug: "regular", name: "Heart Cut", basePrice: 4700, unit: "kg", conditions: standardConditions, processing: ["regular cut", "diced"] }] },
      { slug: "tongue", name: "Tongue", description: "Beef and goat tongue.", parts: [{ slug: "whole", name: "Tongue Whole", basePrice: 6200, unit: "kg", conditions: standardConditions, processing: ["whole", "sliced"] }] },
      { slug: "tripe", name: "Tripe", description: "Well-cleaned tripe.", parts: [{ slug: "regular", name: "Tripe Cut", basePrice: 3000, unit: "kg", conditions: standardConditions, processing: ["regular cut", "cleaned"] }] },
      { slug: "gizzard", name: "Gizzard", description: "Chicken gizzard packs.", parts: [{ slug: "pack", name: "Gizzard Pack", basePrice: 3500, unit: "kg", conditions: standardConditions, processing: ["regular cut", "cleaned"] }] },
      { slug: "cow-leg", name: "Cow Leg", description: "Cow leg chunks.", parts: [{ slug: "chunk", name: "Cow Leg Chunk", basePrice: 2800, unit: "kg", conditions: standardConditions, processing: ["regular cut", "cubed"] }] },
      { slug: "goat-head", name: "Goat Head", description: "Goat head sections.", parts: [{ slug: "section", name: "Goat Head Section", basePrice: 3300, unit: "kg", conditions: standardConditions, processing: ["regular cut", "cleaned"] }] },
      { slug: "chicken-feet", name: "Chicken Feet", description: "Cleaned chicken feet.", parts: [{ slug: "pack", name: "Chicken Feet Pack", basePrice: 2600, unit: "kg", conditions: standardConditions, processing: ["whole", "cleaned"] }] },
    ],
  },
];
