import logger from '../utils/logger';

export interface ParsedFilterCondition {
  field: string;
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';
  value: string | number | boolean;
}

export interface ParsedODataQuery {
  conditions: ParsedFilterCondition[];
  selectColumns: string[];
  expandRelations: string[];
  limit?: number;
  offset?: number;
  orderBy?: { column: string; ascending: boolean };
}

// Map RESO PascalCase attributes to database snake_case columns
export const RESO_TO_DB_COLUMN_MAP: Record<string, string> = {
  ListingKey: 'listing_key',
  ListingId: 'listing_id',
  StandardStatus: 'standard_status',
  PropertyType: 'property_type',
  PropertySubType: 'property_sub_type',
  ListPrice: 'price',
  Price: 'price',
  OriginalListPrice: 'original_list_price',
  LivingArea: 'living_area',
  LivingAreaUnits: 'living_area_units',
  BedroomsTotal: 'bedrooms_total',
  Beds: 'beds',
  BathroomsTotalInteger: 'bathrooms_total_integer',
  Baths: 'baths',
  BathroomsFull: 'bathrooms_full',
  BathroomsHalf: 'bathrooms_half',
  YearBuilt: 'year_built',
  City: 'city',
  StateOrProvince: 'state_or_province',
  State: 'state',
  PostalCode: 'postal_code',
  UnparsedAddress: 'unparsed_address',
  Address: 'address',
  SubdivisionName: 'subdivision_name',
  ParkingTotal: 'parking_total',
  PublicRemarks: 'public_remarks',
  ArchitecturalStyle: 'architectural_style',
};

// Operator mapping from OData to PostgREST / SQL filter
const OPERATOR_MAP: Record<string, ParsedFilterCondition['operator']> = {
  eq: 'eq',
  ne: 'ne',
  gt: 'gt',
  ge: 'gte',
  lt: 'lt',
  le: 'lte',
};

export class ResoQueryParser {
  /**
   * Parse an OData $filter string into structured conditions.
   * e.g. "City eq 'Pasig' and ListPrice le 10000000 and BedroomsTotal ge 2"
   */
  public static parseFilter(filterStr?: string): ParsedFilterCondition[] {
    if (!filterStr || typeof filterStr !== 'string') return [];

    const conditions: ParsedFilterCondition[] = [];
    // Split by ' and ' or ' AND '
    const clauses = filterStr.split(/\s+and\s+/i);

    for (const clause of clauses) {
      const match = clause.trim().match(/^([A-Za-z0-9_]+)\s+(eq|ne|gt|ge|lt|le)\s+(.+)$/i);
      if (!match) continue;

      const rawField = match[1];
      const rawOp = match[2].toLowerCase();
      let rawVal: any = match[3].trim();

      // Parse string literal ('Austin')
      if (rawVal.startsWith("'") && rawVal.endsWith("'")) {
        rawVal = rawVal.slice(1, -1);
      } else if (rawVal === 'true') {
        rawVal = true;
      } else if (rawVal === 'false') {
        rawVal = false;
      } else if (!isNaN(Number(rawVal))) {
        rawVal = Number(rawVal);
      }

      const column = RESO_TO_DB_COLUMN_MAP[rawField] || rawField.toLowerCase();
      const operator = OPERATOR_MAP[rawOp] || 'eq';

      conditions.push({
        field: rawField,
        column,
        operator,
        value: rawVal,
      });
    }

    return conditions;
  }

  /**
   * Parse OData $select string into safe database column projections
   */
  public static parseSelect(selectStr?: string): string[] {
    if (!selectStr || typeof selectStr !== 'string') return [];

    const tokens = selectStr.split(',').map((t) => t.trim());
    const validColumns: string[] = [];

    for (const token of tokens) {
      const col = RESO_TO_DB_COLUMN_MAP[token] || token.toLowerCase();
      // Block sensitive confidential fields from projection
      if (['private_remarks', 'lockbox_code', 'showing_instructions', 'buyer_agency_compensation'].includes(col)) {
        continue;
      }
      validColumns.push(col);
    }

    return validColumns.length > 0 ? validColumns : ['*'];
  }

  /**
   * Parse OData $expand tokens into relationship names
   */
  public static parseExpand(expandStr?: string): string[] {
    if (!expandStr || typeof expandStr !== 'string') return [];

    const allowed = ['media', 'rooms', 'confidential'];
    const tokens = expandStr.split(',').map((t) => t.trim().toLowerCase());
    return tokens.filter((t) => allowed.some((a) => t.startsWith(a)));
  }

  /**
   * Parse full OData v4 parameters
   */
  public static parseOData(params: {
    $filter?: string;
    $select?: string;
    $expand?: string;
    $top?: number;
    $skip?: number;
    $orderby?: string;
  }): ParsedODataQuery {
    const conditions = this.parseFilter(params.$filter);
    const selectColumns = this.parseSelect(params.$select);
    const expandRelations = this.parseExpand(params.$expand);

    let orderBy: { column: string; ascending: boolean } | undefined;
    if (params.$orderby) {
      const parts = params.$orderby.trim().split(/\s+/);
      const col = RESO_TO_DB_COLUMN_MAP[parts[0]] || parts[0].toLowerCase();
      const asc = parts[1]?.toLowerCase() !== 'desc';
      orderBy = { column: col, ascending: asc };
    }

    return {
      conditions,
      selectColumns,
      expandRelations,
      limit: params.$top ? Math.min(params.$top, 100) : undefined,
      offset: params.$skip,
      orderBy,
    };
  }

  /**
   * Redacts sensitive confidential fields for non-privileged callers
   */
  public static redactConfidential<T extends Record<string, any>>(
    property: T,
    userRole?: string
  ): T {
    const isAuthorized = userRole && ['agent', 'broker', 'admin'].includes(userRole);
    if (isAuthorized) return property;

    const sanitized = { ...property };
    delete sanitized.confidential;
    delete sanitized.private_remarks;
    delete sanitized.lockbox_code;
    delete sanitized.lockbox_type;
    delete sanitized.lockbox_location;
    delete sanitized.showing_instructions;
    delete sanitized.buyer_agency_compensation;
    delete sanitized.seller_direct_phone;
    delete sanitized.seller_direct_email;

    return sanitized;
  }
}

export default ResoQueryParser;
