
export interface GrapeServerConfig {
    test_env?: boolean, 
    grape?: string, // Grape url like 'http://127.0.0.1:30001'
    port?: number, // Server port
    db_url?: string,
    name: string // Name of service
  }
  
  