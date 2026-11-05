import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { subdivisionValidationService, LotInput, ValidationResult } from './subdivisionValidation.service';
import logger from '../utils/logger';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUuid(id?: string | null): boolean {
  return Boolean(id && UUID_REGEX.test(id));
}

export interface SubdivisionProject {
  id: string;
  name: string;
  developer_name?: string | null;
  location_address: string;
  city: string;
  province_state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: 'Planning' | 'Active' | 'SoldOut' | 'Archived';
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubdivisionPlan {
  id: string;
  project_id: string;
  plan_title: string;
  image_url: string;
  file_name?: string | null;
  file_size_bytes?: number | null;
  image_width: number;
  image_height: number;
  aspect_ratio?: number | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubdivisionLot {
  id: string;
  project_id: string;
  plan_id: string;
  block_number: string;
  lot_number: string;
  boundary_type: 'SaleableLot' | 'Road' | 'Park' | 'Facility' | 'Waterway' | 'Other';
  availability_status: 'Available' | 'Reserved' | 'Sold' | 'Unavailable';
  verified_area_sqm: number;
  price?: number | null;
  description?: string | null;
  coordinates: Array<{ x: number; y: number }>;
  is_verified: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubdivisionMapVersion {
  id: string;
  project_id: string;
  plan_id: string;
  version_number: number;
  snapshot_data: {
    lots: SubdivisionLot[];
    plan: Partial<SubdivisionPlan>;
    totalAreaSqm: number;
  };
  published_by: string;
  published_at: string;
  restored_from_version?: number | null;
  notes?: string | null;
}

export class SubdivisionService {
  async verifyProjectOwnership(
    projectId: string,
    userId?: string,
    userRole?: string
  ): Promise<SubdivisionProject> {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error(`Subdivision project #${projectId} not found.`);
    }
    if (userRole === 'admin') {
      return project;
    }
    if (project.created_by && userId && project.created_by !== userId) {
      const err: any = new Error('Forbidden: You do not own this subdivision project');
      err.name = 'ForbiddenException';
      err.status = 403;
      throw err;
    }
    return project;
  }

  // In-memory fallback stores
  private memProjects: Map<string, SubdivisionProject> = new Map();
  private memPlans: Map<string, SubdivisionPlan> = new Map();
  private memLots: Map<string, SubdivisionLot[]> = new Map(); // projectId -> lots
  private memVersions: Map<string, SubdivisionMapVersion[]> = new Map(); // projectId -> versions

  constructor() {
    this.seedDefaultMockProject();
  }

  private seedDefaultMockProject() {
    const defaultProjectId = 'sub-proj-001';
    const defaultPlanId = 'sub-plan-001';

    const sampleProject: SubdivisionProject = {
      id: defaultProjectId,
      name: 'Aura Residences Master Planned Community',
      developer_name: 'Human Shelter Developments',
      location_address: 'Bonifacio Global City, Taguig',
      city: 'Taguig',
      province_state: 'Metro Manila',
      latitude: 14.5489,
      longitude: 121.0503,
      status: 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const samplePlan: SubdivisionPlan = {
      id: defaultPlanId,
      project_id: defaultProjectId,
      plan_title: 'Phase 1 Master Site Cadastral Blueprint',
      image_url: '',
      file_name: '',
      file_size_bytes: 0,
      image_width: 1600,
      image_height: 1000,
      aspect_ratio: 1.6,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sampleLots: SubdivisionLot[] = [
      {
        id: 'lot-001',
        project_id: defaultProjectId,
        plan_id: defaultPlanId,
        block_number: '1',
        lot_number: '1',
        boundary_type: 'SaleableLot',
        availability_status: 'Available',
        verified_area_sqm: 280,
        price: 28500000,
        description: 'Prime corner lot facing East parkway',
        coordinates: [
          { x: 120, y: 150 },
          { x: 260, y: 150 },
          { x: 260, y: 320 },
          { x: 120, y: 320 },
        ],
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'lot-002',
        project_id: defaultProjectId,
        plan_id: defaultPlanId,
        block_number: '1',
        lot_number: '2',
        boundary_type: 'SaleableLot',
        availability_status: 'Reserved',
        verified_area_sqm: 250,
        price: 25000000,
        description: 'Mid-block residential lot with gentle slope',
        coordinates: [
          { x: 280, y: 150 },
          { x: 420, y: 150 },
          { x: 420, y: 320 },
          { x: 280, y: 320 },
        ],
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'lot-003',
        project_id: defaultProjectId,
        plan_id: defaultPlanId,
        block_number: '1',
        lot_number: '3',
        boundary_type: 'SaleableLot',
        availability_status: 'Sold',
        verified_area_sqm: 310,
        price: 32000000,
        description: 'Generous executive lot',
        coordinates: [
          { x: 440, y: 150 },
          { x: 590, y: 150 },
          { x: 590, y: 320 },
          { x: 440, y: 320 },
        ],
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.memProjects.set(defaultProjectId, sampleProject);
    this.memPlans.set(defaultPlanId, samplePlan);
    this.memLots.set(defaultProjectId, sampleLots);

    // Initial version
    const sampleVersion: SubdivisionMapVersion = {
      id: 'ver-001',
      project_id: defaultProjectId,
      plan_id: defaultPlanId,
      version_number: 1,
      snapshot_data: {
        lots: sampleLots,
        plan: samplePlan,
        totalAreaSqm: 840,
      },
      published_by: 'b0000000-0000-0000-0000-000000000001',
      published_at: new Date().toISOString(),
      notes: 'Initial published master cadastral plan',
    };
    this.memVersions.set(defaultProjectId, [sampleVersion]);
  }

  // ==========================================
  // Subdivision Projects (FR-001)
  // ==========================================

  async createProject(
    data: {
      name: string;
      developer_name?: string;
      location_address: string;
      city: string;
      province_state?: string;
      latitude?: number;
      longitude?: number;
      status?: 'Planning' | 'Active' | 'SoldOut' | 'Archived';
    },
    userId?: string
  ): Promise<SubdivisionProject> {
    const newProject: SubdivisionProject = {
      id: `sub-proj-${Date.now()}`,
      name: data.name,
      developer_name: data.developer_name || null,
      location_address: data.location_address,
      city: data.city,
      province_state: data.province_state || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      status: data.status || 'Active',
      created_by: userId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: dbData, error } = await supabaseAdmin
          .from('subdivision_projects')
          .insert({
            name: newProject.name,
            developer_name: newProject.developer_name,
            location_address: newProject.location_address,
            city: newProject.city,
            province_state: newProject.province_state,
            latitude: newProject.latitude,
            longitude: newProject.longitude,
            status: newProject.status,
            created_by: newProject.created_by,
          })
          .select()
          .single();

        if (!error && dbData) {
          this.memProjects.set(dbData.id, dbData);
          return dbData;
        }
      } catch (err) {
        logger.warn('[SubdivisionService] Supabase project insert fallback to memory:', err);
      }
    }

    this.memProjects.set(newProject.id, newProject);
    return newProject;
  }

  async listProjects(): Promise<SubdivisionProject[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('subdivision_projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          data.forEach((p) => this.memProjects.set(p.id, p));
          return data;
        }
      } catch (err) {
        logger.warn('[SubdivisionService] Supabase listProjects fallback to memory:', err);
      }
    }

    return Array.from(this.memProjects.values());
  }

  async getProjectById(id: string): Promise<SubdivisionProject | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('subdivision_projects')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          this.memProjects.set(data.id, data);
          return data;
        }
      } catch (err) {
        logger.warn('[SubdivisionService] Supabase getProjectById fallback:', err);
      }
    }

    return this.memProjects.get(id) || null;
  }

  // ==========================================
  // Plans & Graphics (FR-002, FR-003, FR-004, FR-005)
  // ==========================================

  async addPlan(
    projectId: string,
    data: {
      plan_title: string;
      image_url: string;
      file_name?: string;
      file_size_bytes?: number;
      image_width: number;
      image_height: number;
    },
    userId?: string,
    userRole?: string
  ): Promise<SubdivisionPlan> {
    await this.verifyProjectOwnership(projectId, userId, userRole);
    const aspectRatio =
      data.image_width && data.image_height
        ? Number((data.image_width / data.image_height).toFixed(4))
        : 1.0;

    const newPlan: SubdivisionPlan = {
      id: `sub-plan-${Date.now()}`,
      project_id: projectId,
      plan_title: data.plan_title,
      image_url: data.image_url,
      file_name: data.file_name || null,
      file_size_bytes: data.file_size_bytes || null,
      image_width: data.image_width,
      image_height: data.image_height,
      aspect_ratio: aspectRatio,
      is_active: true,
      created_by: userId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        // Set previous plans to is_active = false
        await supabaseAdmin
          .from('subdivision_plans')
          .update({ is_active: false })
          .eq('project_id', projectId);

        const { data: dbData, error } = await supabaseAdmin
          .from('subdivision_plans')
          .insert({
            project_id: projectId,
            plan_title: newPlan.plan_title,
            image_url: newPlan.image_url,
            file_name: newPlan.file_name,
            file_size_bytes: newPlan.file_size_bytes,
            image_width: newPlan.image_width,
            image_height: newPlan.image_height,
            aspect_ratio: newPlan.aspect_ratio,
            is_active: true,
            created_by: newPlan.created_by,
          })
          .select()
          .single();

        if (!error && dbData) {
          // Deactivate prior memory plans
          for (const p of this.memPlans.values()) {
            if (p.project_id === projectId) {
              p.is_active = false;
            }
          }
          this.memPlans.set(dbData.id, dbData);
          return dbData;
        }
      } catch (err) {
        logger.warn('[SubdivisionService] Supabase addPlan fallback to memory:', err);
      }
    }

    // Deactivate prior memory plans
    for (const p of this.memPlans.values()) {
      if (p.project_id === projectId) {
        p.is_active = false;
      }
    }
    this.memPlans.set(newPlan.id, newPlan);
    return newPlan;
  }

  async getActivePlan(projectId: string): Promise<SubdivisionPlan | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('subdivision_plans')
          .select('*')
          .eq('project_id', projectId)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && data) {
          this.memPlans.set(data.id, data);
          return data;
        }
      } catch (err) {
        logger.warn('[SubdivisionService] Supabase getActivePlan fallback:', err);
      }
    }

    for (const plan of this.memPlans.values()) {
      if (plan.project_id === projectId && plan.is_active) {
        return plan;
      }
    }

    return null;
  }

  // ==========================================
  // Draft Lots & Vector Editing (FR-006 to FR-030)
  // ==========================================

  async getDraftLots(projectId: string): Promise<SubdivisionLot[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('subdivision_lots')
          .select('*')
          .eq('project_id', projectId)
          .order('block_number', { ascending: true })
          .order('lot_number', { ascending: true });

        if (!error && data && data.length > 0) {
          this.memLots.set(projectId, data);
          return data;
        }
      } catch (err) {
        logger.warn('[SubdivisionService] Supabase getDraftLots fallback to memory:', err);
      }
    }

    return this.memLots.get(projectId) || [];
  }

  async batchSaveDraftLots(
    projectId: string,
    planId: string,
    lots: LotInput[],
    userId?: string,
    userRole?: string
  ): Promise<SubdivisionLot[]> {
    await this.verifyProjectOwnership(projectId, userId, userRole);

    const activePlan = await this.getActivePlan(projectId);
    const resolvedPlanId = (planId && planId !== 'default' && isValidUuid(planId))
      ? planId
      : (activePlan?.id && isValidUuid(activePlan.id) ? activePlan.id : planId);

    const savedLots: SubdivisionLot[] = lots.map((lot, idx) => ({
      id: lot.id || `lot-${Date.now()}-${idx}`,
      project_id: projectId,
      plan_id: resolvedPlanId || lot.plan_id || 'sub-plan-001',
      block_number: String(lot.block_number).trim(),
      lot_number: String(lot.lot_number).trim(),
      boundary_type: lot.boundary_type || 'SaleableLot',
      availability_status: lot.availability_status || 'Available',
      verified_area_sqm: Number(lot.verified_area_sqm) || 0,
      price: lot.price !== undefined ? lot.price : null,
      description: lot.description || null,
      coordinates: lot.coordinates || [],
      is_verified: lot.is_verified ?? true,
      created_by: userId || null,
      updated_by: userId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    if (isSupabaseConfigured) {
      try {
        // Sync deletions: find existing lots in DB that are not in incoming draft lots
        const { data: existingLots } = await supabaseAdmin
          .from('subdivision_lots')
          .select('id, block_number, lot_number')
          .eq('project_id', projectId);

        if (existingLots && existingLots.length > 0) {
          const incomingKeys = new Set(savedLots.map((l) => `${l.block_number}:${l.lot_number}`));
          const toDeleteIds = existingLots
            .filter((el) => !incomingKeys.has(`${el.block_number}:${el.lot_number}`))
            .map((el) => el.id);

          if (toDeleteIds.length > 0) {
            await supabaseAdmin
              .from('subdivision_lots')
              .delete()
              .in('id', toDeleteIds);
          }
        }

        // Upsert draft lots
        const upsertPayload = savedLots.map((l) => {
          const item: any = {
            project_id: l.project_id,
            block_number: l.block_number,
            lot_number: l.lot_number,
            boundary_type: l.boundary_type,
            availability_status: l.availability_status,
            verified_area_sqm: l.verified_area_sqm,
            price: l.price,
            description: l.description,
            coordinates: l.coordinates,
            is_verified: l.is_verified,
            updated_by: isValidUuid(userId) ? userId : null,
          };
          if (isValidUuid(l.plan_id)) {
            item.plan_id = l.plan_id;
          } else if (activePlan?.id && isValidUuid(activePlan.id)) {
            item.plan_id = activePlan.id;
          }
          return item;
        });

        const { data, error } = await supabaseAdmin
          .from('subdivision_lots')
          .upsert(upsertPayload, { onConflict: 'project_id,block_number,lot_number' })
          .select();

        if (error) {
          logger.warn('[SubdivisionService] Supabase batchSaveDraftLots upsert warning:', error.message);
        } else if (data) {
          this.memLots.set(projectId, data);
          return data;
        }
      } catch (err: any) {
        logger.warn('[SubdivisionService] Supabase batchSaveDraftLots fallback to memory:', err?.message || err);
      }
    }

    this.memLots.set(projectId, savedLots);
    return savedLots;
  }

  // ==========================================
  // Pre-Flight Validation & Publishing (FR-031 to FR-037)
  // ==========================================

  async validateProjectDraft(projectId: string): Promise<ValidationResult> {
    const lots = await this.getDraftLots(projectId);
    return subdivisionValidationService.validateDraft(lots);
  }

  async publishMapVersion(
    projectId: string,
    planId?: string,
    notes?: string,
    userId: string = 'b0000000-0000-0000-0000-000000000001',
    userRole?: string
  ): Promise<{ success: boolean; version?: SubdivisionMapVersion; validation: ValidationResult }> {
    await this.verifyProjectOwnership(projectId, userId, userRole);

    const lots = await this.getDraftLots(projectId);
    const plan = (await this.getActivePlan(projectId)) || ({} as any);

    // 1. Run Pre-Flight Validation
    const validation = subdivisionValidationService.validateDraft(lots);

    if (!validation.isValid) {
      return { success: false, validation };
    }

    // 2. Compute Next Monotonic Version Number
    const existingVersions = await this.listVersions(projectId);
    const nextVersionNumber =
      existingVersions.length > 0
        ? Math.max(...existingVersions.map((v) => v.version_number)) + 1
        : 1;

    const resolvedPlanId = (planId && planId !== 'default' && isValidUuid(planId))
      ? planId
      : (plan?.id && isValidUuid(plan.id) ? plan.id : null);

    const newVersion: SubdivisionMapVersion = {
      id: `ver-${Date.now()}`,
      project_id: projectId,
      plan_id: resolvedPlanId || plan?.id || 'sub-plan-001',
      version_number: nextVersionNumber,
      snapshot_data: {
        lots,
        plan,
        totalAreaSqm: validation.stats.totalAreaSqm,
      },
      published_by: userId,
      published_at: new Date().toISOString(),
      notes: notes || `Published Version ${nextVersionNumber}`,
    };

    if (isSupabaseConfigured) {
      try {
        const insertPayload: any = {
          project_id: projectId,
          version_number: nextVersionNumber,
          snapshot_data: newVersion.snapshot_data,
          notes: newVersion.notes,
        };

        if (resolvedPlanId) {
          insertPayload.plan_id = resolvedPlanId;
        } else if (plan?.id && isValidUuid(plan.id)) {
          insertPayload.plan_id = plan.id;
        }

        if (isValidUuid(userId)) {
          insertPayload.published_by = userId;
        }

        const { data, error } = await supabaseAdmin
          .from('subdivision_map_versions')
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          logger.warn('[SubdivisionService] Supabase publishMapVersion insert warning:', error.message);
        } else if (data) {
          const versions = this.memVersions.get(projectId) || [];
          versions.unshift(data);
          this.memVersions.set(projectId, versions);
          return { success: true, version: data, validation };
        }
      } catch (err: any) {
        logger.warn('[SubdivisionService] Supabase publishMapVersion fallback to memory:', err?.message || err);
      }
    }

    const versions = this.memVersions.get(projectId) || [];
    versions.unshift(newVersion);
    this.memVersions.set(projectId, versions);

    return { success: true, version: newVersion, validation };
  }

  async listVersions(projectId: string): Promise<SubdivisionMapVersion[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('subdivision_map_versions')
          .select('*')
          .eq('project_id', projectId)
          .order('version_number', { ascending: false });

        if (!error && data) {
          this.memVersions.set(projectId, data);
          return data;
        }
      } catch (err) {
        logger.warn('[SubdivisionService] Supabase listVersions fallback:', err);
      }
    }

    return this.memVersions.get(projectId) || [];
  }

  async restoreVersion(
    projectId: string,
    versionNumber: number,
    userId: string,
    userRole?: string
  ): Promise<{ success: boolean; restoredVersion: SubdivisionMapVersion; draftLots: SubdivisionLot[] }> {
    await this.verifyProjectOwnership(projectId, userId, userRole);

    const versions = await this.listVersions(projectId);
    const target = versions.find((v) => v.version_number === versionNumber);

    if (!target) {
      throw new Error(`Subdivision version #${versionNumber} not found.`);
    }

    // 1. Restore lots array from immutable snapshot data
    const restoredLots: SubdivisionLot[] = target.snapshot_data.lots.map((l) => ({
      ...l,
      updated_at: new Date().toISOString(),
    }));

    // Clean up draft lots in Supabase before restoring to prevent zombie / orphan lots
    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('subdivision_lots').delete().eq('project_id', projectId);
      } catch (err: any) {
        logger.warn('[SubdivisionService] Error clearing existing draft lots before restore:', err?.message || err);
      }
    }

    // 2. Overwrite working draft in lots table
    await this.batchSaveDraftLots(projectId, target.plan_id, restoredLots, userId, userRole);

    // 3. Monotonically publish new version recording restored_from_version
    const nextVersionNumber = Math.max(...versions.map((v) => v.version_number)) + 1;

    const rollbackVersionRecord: SubdivisionMapVersion = {
      id: `ver-${Date.now()}`,
      project_id: projectId,
      plan_id: target.plan_id,
      version_number: nextVersionNumber,
      snapshot_data: target.snapshot_data,
      published_by: userId,
      published_at: new Date().toISOString(),
      restored_from_version: versionNumber,
      notes: `Restored from historical Version ${versionNumber}`,
    };

    if (isSupabaseConfigured) {
      try {
        const insertPayload: any = {
          project_id: projectId,
          version_number: nextVersionNumber,
          snapshot_data: rollbackVersionRecord.snapshot_data,
          restored_from_version: versionNumber,
          notes: rollbackVersionRecord.notes,
        };
        if (isValidUuid(target.plan_id)) {
          insertPayload.plan_id = target.plan_id;
        }
        if (isValidUuid(userId)) {
          insertPayload.published_by = userId;
        }

        await supabaseAdmin.from('subdivision_map_versions').insert(insertPayload);
      } catch (err: any) {
        logger.warn('[SubdivisionService] Supabase restoreVersion fallback:', err?.message || err);
      }
    }

    versions.unshift(rollbackVersionRecord);
    this.memVersions.set(projectId, versions);

    return {
      success: true,
      restoredVersion: rollbackVersionRecord,
      draftLots: restoredLots,
    };
  }

  // ==========================================
  // Public Interactive Map (FR-038 to FR-043)
  // ==========================================

  async getPublicPublishedMap(projectId: string): Promise<{
    project: SubdivisionProject | null;
    plan: Partial<SubdivisionPlan> | null;
    lots: SubdivisionLot[];
    versionNumber: number;
    publishedAt: string;
  } | null> {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const versions = await this.listVersions(projectId);
    if (versions.length === 0) {
      // Fallback: if no version published yet, return active plan with empty lots array for visitors
      const plan = await this.getActivePlan(projectId);
      return {
        project,
        plan,
        lots: [],
        versionNumber: 0,
        publishedAt: project.created_at,
      };
    }

    // Latest published version snapshot (zero draft leakage)
    const latest = versions[0];
    return {
      project,
      plan: latest.snapshot_data.plan,
      lots: latest.snapshot_data.lots,
      versionNumber: latest.version_number,
      publishedAt: latest.published_at,
    };
  }
}

export const subdivisionService = new SubdivisionService();
