import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface User {
  id?: number;
  telegram_id: string;
  username?: string;
  first_name?: string;
  created_at?: Date;
  is_active?: boolean;
}

export interface Profession {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  created_at?: Date;
}

export interface JobType {
  id: number;
  name: string;
  slug: string;
  created_at?: Date;
}

export interface UserPreference {
  id: number;
  user_id: string;
  profession_id: number;
  job_type_id: number;
  keywords?: string[];
  created_at?: Date;
  profession?: Profession;
  job_type?: JobType;
}

export interface JobPost {
  id: number;
  title: string;
  description?: string;
  company?: string;
  location?: string;
  salary?: string;
  post_url?: string;
  channel_message_id?: number;
  profession_id?: number;
  job_type_id?: number;
  posted_at?: Date;
  scraped_at?: Date;
  is_processed?: boolean;
  profession?: Profession;
  job_type?: JobType;
}

export class Database {
  // User operations
  static async createUser(telegramId: string, username?: string, firstName?: string): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (telegram_id, username, first_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id)
       DO UPDATE SET username = EXCLUDED.username, first_name = EXCLUDED.first_name
       RETURNING *`,
      [telegramId, username || null, firstName || null]
    );
    return result.rows[0] as User;
  }

  static async getUserByTelegramId(telegramId: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return (result.rows[0] as User) || null;
  }

  // Profession operations
  static async getAllProfessions(): Promise<Profession[]> {
    const result = await pool.query('SELECT * FROM professions ORDER BY name');
    return result.rows as Profession[];
  }

  static async getAllJobTypes(): Promise<JobType[]> {
    const result = await pool.query('SELECT * FROM job_types ORDER BY name');
    return result.rows as JobType[];
  }

  // User preferences
  static async getUserPreferences(userId: string): Promise<UserPreference[]> {
    const result = await pool.query(
      `SELECT up.*, p.name as profession_name, p.slug as profession_slug, p.icon as profession_icon,
              jt.name as job_type_name, jt.slug as job_type_slug
         FROM user_preferences up
         JOIN professions p ON up.profession_id = p.id
         JOIN job_types jt ON up.job_type_id = jt.id
        WHERE up.user_id = $1
        ORDER BY up.created_at DESC`,
      [userId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      profession_id: row.profession_id,
      job_type_id: row.job_type_id,
      keywords: row.keywords,
      created_at: row.created_at,
      profession: {
        id: row.profession_id,
        name: row.profession_name,
        slug: row.profession_slug,
        icon: row.profession_icon,
        created_at: row.created_at,
      },
      job_type: {
        id: row.job_type_id,
        name: row.job_type_name,
        slug: row.job_type_slug,
        created_at: row.created_at,
      },
    })) as UserPreference[];
  }

  static async addUserPreference(
    userId: string,
    professionId: number,
    jobTypeId: number,
    keywords?: string[],
  ): Promise<UserPreference> {
    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, profession_id, job_type_id, keywords)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, profession_id, job_type_id)
       DO UPDATE SET keywords = EXCLUDED.keywords
       RETURNING *`,
      [userId, professionId, jobTypeId, keywords || null]
    );
    return result.rows[0] as UserPreference;
  }

  static async removeUserPreference(userId: string, preferenceId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM user_preferences WHERE id = $1 AND user_id = $2',
      [preferenceId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // Job post operations
  static async createJobPost(jobData: {
    title: string;
    description?: string;
    company?: string;
    location?: string;
    salary?: string;
    post_url?: string;
    channel_message_id?: number;
    profession_id?: number;
    job_type_id?: number;
    posted_at?: Date;
  }): Promise<JobPost> {
    const result = await pool.query(
      `INSERT INTO job_posts (title, description, company, location, salary, post_url, channel_message_id, profession_id, job_type_id, posted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        jobData.title,
        jobData.description || null,
        jobData.company || null,
        jobData.location || null,
        jobData.salary || null,
        jobData.post_url || null,
        jobData.channel_message_id || null,
        jobData.profession_id || null,
        jobData.job_type_id || null,
        jobData.posted_at ? jobData.posted_at.toISOString() : null,
      ]
    );
    return result.rows[0] as JobPost;
  }

  static async getTodaysJobs(): Promise<JobPost[]> {
    const result = await pool.query(
      `SELECT jp.*, p.name as profession_name, p.slug as profession_slug, p.icon as profession_icon,
              jt.name as job_type_name, jt.slug as job_type_slug
         FROM job_posts jp
         LEFT JOIN professions p ON jp.profession_id = p.id
         LEFT JOIN job_types jt ON jp.job_type_id = jt.id
        WHERE DATE(jp.posted_at) = CURRENT_DATE
        ORDER BY jp.posted_at DESC`
    );
    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      company: row.company,
      location: row.location,
      salary: row.salary,
      post_url: row.post_url,
      channel_message_id: row.channel_message_id,
      profession_id: row.profession_id,
      job_type_id: row.job_type_id,
      posted_at: row.posted_at,
      scraped_at: row.scraped_at,
      is_processed: row.is_processed,
      profession: row.profession_id
        ? {
            id: row.profession_id,
            name: row.profession_name,
            slug: row.profession_slug,
            icon: row.profession_icon,
            created_at: row.created_at,
          }
        : undefined,
      job_type: row.job_type_id
        ? {
            id: row.job_type_id,
            name: row.job_type_name,
            slug: row.job_type_slug,
            created_at: row.created_at,
          }
        : undefined,
    })) as JobPost[];
  }

  static async getJobsByPreferences(userId: string): Promise<JobPost[]> {
    const result = await pool.query(
      `SELECT DISTINCT jp.*, p.name as profession_name, p.slug as profession_slug, p.icon as profession_icon,
              jt.name as job_type_name, jt.slug as job_type_slug
         FROM job_posts jp
         LEFT JOIN professions p ON jp.profession_id = p.id
         LEFT JOIN job_types jt ON jp.job_type_id = jt.id
         JOIN user_preferences up ON (jp.profession_id = up.profession_id AND jp.job_type_id = up.job_type_id)
        WHERE up.user_id = $1
        AND DATE(jp.posted_at) = CURRENT_DATE
        ORDER BY jp.posted_at DESC`,
      [userId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      company: row.company,
      location: row.location,
      salary: row.salary,
      post_url: row.post_url,
      channel_message_id: row.channel_message_id,
      profession_id: row.profession_id,
      job_type_id: row.job_type_id,
      posted_at: row.posted_at,
      scraped_at: row.scraped_at,
      is_processed: row.is_processed,
      profession: row.profession_id
        ? {
            id: row.profession_id,
            name: row.profession_name,
            slug: row.profession_slug,
            icon: row.profession_icon,
            created_at: row.created_at,
          }
        : undefined,
      job_type: row.job_type_id
        ? {
            id: row.job_type_id,
            name: row.job_type_name,
            slug: row.job_type_slug,
            created_at: row.created_at,
          }
        : undefined,
    })) as JobPost[];
  }

  static async getUsersWithMatchingPreferences(professionId: number, jobTypeId: number): Promise<User[]> {
    const result = await pool.query(
      `SELECT DISTINCT u.* FROM users u
         JOIN user_preferences up ON u.telegram_id = up.user_id
        WHERE up.profession_id = $1
          AND up.job_type_id = $2
          AND (u.is_active IS NULL OR u.is_active = true)`,
      [professionId, jobTypeId]
    );
    return result.rows as User[];
  }

  static async logNotification(userId: string, jobPostId: number): Promise<void> {
    await pool.query(
      `INSERT INTO notifications (user_id, job_post_id)
       VALUES ($1, $2)`,
      [userId, jobPostId]
    );
  }

  static async markJobAsProcessed(jobId: number): Promise<void> {
    await pool.query(
      `UPDATE job_posts SET is_processed = true WHERE id = $1`,
      [jobId]
    );
  }
}
