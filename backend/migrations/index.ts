import * as migration_20260714_132203_initial from './20260714_132203_initial';
import * as migration_20260715_085159_media_staging from './20260715_085159_media_staging';
import * as migration_20260720_000000_cta_visibility from './20260720_000000_cta_visibility';
import * as migration_20260720_082526_event_logistics from './20260720_082526_event_logistics';
import * as migration_20260720_164900_user_roles_enum from './20260720_164900_user_roles_enum';
import * as migration_20260720_164937_admin_overhaul from './20260720_164937_admin_overhaul';
import * as migration_20260721_105955_edition_archives from './20260721_105955_edition_archives';
import * as migration_20260819_180000_logistics_heading from './20260819_180000_logistics_heading';
import * as migration_20260819_191500_results_visibility from './20260819_191500_results_visibility';

export const migrations = [
  {
    up: migration_20260714_132203_initial.up,
    down: migration_20260714_132203_initial.down,
    name: '20260714_132203_initial',
  },
  {
    up: migration_20260715_085159_media_staging.up,
    down: migration_20260715_085159_media_staging.down,
    name: '20260715_085159_media_staging',
  },
  {
    up: migration_20260720_000000_cta_visibility.up,
    down: migration_20260720_000000_cta_visibility.down,
    name: '20260720_000000_cta_visibility',
  },
  {
    up: migration_20260720_082526_event_logistics.up,
    down: migration_20260720_082526_event_logistics.down,
    name: '20260720_082526_event_logistics',
  },
  {
    up: migration_20260720_164900_user_roles_enum.up,
    down: migration_20260720_164900_user_roles_enum.down,
    name: '20260720_164900_user_roles_enum',
  },
  {
    up: migration_20260720_164937_admin_overhaul.up,
    down: migration_20260720_164937_admin_overhaul.down,
    name: '20260720_164937_admin_overhaul',
  },
  {
    up: migration_20260721_105955_edition_archives.up,
    down: migration_20260721_105955_edition_archives.down,
    name: '20260721_105955_edition_archives'
  },
  {
    up: migration_20260819_180000_logistics_heading.up,
    down: migration_20260819_180000_logistics_heading.down,
    name: '20260819_180000_logistics_heading',
  },
  {
    up: migration_20260819_191500_results_visibility.up,
    down: migration_20260819_191500_results_visibility.down,
    name: '20260819_191500_results_visibility',
  },
];
