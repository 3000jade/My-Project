import { ResoODataQuery, ResoODataResponse, ResoProperty } from '../../types/reso';

/**
 * Service to execute OData v4 queries against the RESO Web API /Property resource.
 * Enforces pagination limits, projected fields, and confidential field redaction.
 */
export class ResoService {
  private defaultSelect = 'ListingKey,ListingId,ListPrice,StandardStatus,BedroomsTotal,BathroomsTotalInteger,LivingArea,City,PostalCode,PublicRemarks';

  /**
   * Sanitizes and builds an OData query adhering strictly to RESO standards
   */
  public buildODataQuery(params: ResoODataQuery): ResoODataQuery {
    const top = Math.min(params.$top ?? 10, 20); // Cap at 20 max to prevent context bloat
    const select = params.$select || this.defaultSelect;
    const expand = params.$expand || 'Media($select=MediaURL,Order,MediaCategory;$top=3)';

    return {
      $filter: params.$filter,
      $select: select,
      $expand: expand,
      $top: top,
      $skip: params.$skip ?? 0,
      $orderby: params.$orderby
    };
  }

  /**
   * Redacts sensitive MLS / RESO fields before returning data to client callers
   */
  public sanitizePropertyRecord(property: Partial<ResoProperty> & Record<string, unknown>): Partial<ResoProperty> {
    const { 
      PrivateRemarks, 
      ShowingInstructions, 
      LockBoxSerialNumber, 
      OwnerName, 
      OwnerPhone, 
      ...safeFields 
    } = property;

    return safeFields as Partial<ResoProperty>;
  }

  /**
   * Stub execution method for querying properties
   */
  public async queryProperties(query: ResoODataQuery): Promise<ResoODataResponse<Partial<ResoProperty>>> {
    const normalizedQuery = this.buildODataQuery(query);

    return {
      '@odata.context': 'https://api.reso.org/v1/$metadata#Property',
      '@odata.count': 0,
      value: []
    };
  }
}

export const resoService = new ResoService();
export default resoService;
