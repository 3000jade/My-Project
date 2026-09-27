---
name: querying-reso-listings
description: Translates natural language property search criteria into standardized RESO Data Dictionary fields and OData v4 queries. Use when building real estate filters, querying listings, or inspecting MLS attributes.
---

# RESO Query & Data Dictionary Expert

## Field & Entity Mappings
- **Resource**: Use `/Property` for real estate listings.
- **Identifiers**: `ListingKey` (internal UUID/string), `ListingId` (public MLS number).
- **Core Statuses (`StandardStatus`)**:
  - `Active`: On-market, accepting offers.
  - `Active Under Contract`: Contingent / backup offers solicited.
  - `Pending`: In escrow, no active showings.
  - `Closed`: Sold / leased.
- **Physical Dimensions**:
  - Area: `LivingArea`, `LotSizeArea`, `LotSizeUnits` ('Square Feet', 'Acres', 'Square Meters').
  - Rooms: `BedroomsTotal`, `BathroomsTotalInteger`, `BathroomsFull`, `BathroomsHalf`.
- **Financials**: `ListPrice`, `OriginalListPrice`, `AssociationFee`, `AssociationFeeFrequency`.

## OData v4 Rules
1. Logical operators (`eq`, `ne`, `ge`, `le`, `and`, `or`) must be strictly lowercase.
2. String literals must be enclosed in single quotes: `City eq 'Austin'`.
3. Never request unbounded property queries. Always enforce `$top=10` or `$top=20`.
4. Always project with `$select` to keep token usage minimal.
   - Default: `$select=ListingKey,ListingId,ListPrice,StandardStatus,BedroomsTotal,BathroomsTotalInteger,LivingArea,City,PostalCode,PublicRemarks`
5. Media expansion: `$expand=Media($select=MediaURL,Order,MediaCategory;$top=3)`

## Redaction Constraints
Never display or return confidential fields to client UI:
- Do NOT expose `PrivateRemarks`, lockbox codes, showing passwords, or seller phone/email.
