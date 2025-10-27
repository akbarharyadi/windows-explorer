/**
 * Represents a folder in the directory tree structure
 */
export interface FolderNode {
  /** Unique identifier for the folder */
  id: string
  /** Name of the folder */
  name: string
  /** ID of the parent folder, or null if it's a root folder */
  parentId: string | null
  /** Child folders (optional, populated when expanded) */
  children?: FolderNode[]
  /** Nesting level of the folder in the tree (0 for root) */
  level: number
  /** Creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
}

/**
 * Represents a file within the system
 */
export interface FileItem {
  /** Unique identifier for the file */
  id: string
  /** Name of the file including extension */
  name: string
  /** ID of the folder containing this file */
  folderId: string
  /** Size of the file in bytes */
  size: number
  /** MIME type of the file, or null if unknown */
  mimeType: string | null
  /** Creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
}

/**
 * Contains the child elements of a folder (subfolders and files)
 */
export interface FolderChildren {
  /** Array of subfolders within the parent folder */
  folders: FolderNode[]
  /** Array of files within the parent folder */
  files: FileItem[]
}

/**
 * Standard API response format used throughout the application
 */
export interface ApiResponse<T> {
  /** Indicates if the request was successful */
  success: boolean
  /** Response data payload (present on success) */
  data?: T
  /** Error message (present on failure) */
  error?: string
  /** Optional message providing additional context */
  message?: string
}

/**
 * Results from a search operation containing matching folders and files
 */
export interface SearchResults {
  /** Folders that match the search criteria */
  folders: FolderNode[]
  /** Files that match the search criteria */
  files: FileItem[]
}

/**
 * Represents a file upload operation in progress
 */
export interface FileUpload {
  /** Unique identifier for the upload operation */
  id: string
  /** Name of the file being uploaded */
  name: string
  /** Size of the file in bytes */
  size: number
  /** Current status of the upload */
  status: 'pending' | 'uploading' | 'success' | 'error'
  /** Upload progress percentage (0-100) */
  progress: number
  /** Native File object being uploaded */
  file: File
  /** Target folder ID for the upload */
  folderId: string
}

/**
 * Represents a drag-and-drop interaction event
 */
export interface DragAndDropEvent {
  /** Type of item being dragged ('folder' or 'file') */
  type: 'folder' | 'file'
  /** Unique identifier of the dragged item */
  id: string
  /** Display name of the dragged item */
  name: string
}

/**
 * Represents an item in a context menu
 */
export interface ContextMenuItem {
  /** Unique identifier for the menu item */
  id: string
  /** Display text for the menu item */
  label: string
  /** Function to execute when the item is selected */
  action: () => void
  /** Optional icon to display with the menu item */
  icon?: string
  /** Whether the menu item should be disabled */
  disabled?: boolean
}

/**
 * Statistics about a folder including counts and size
 */
export interface FolderStats {
  /** Total number of subfolders */
  totalFolders: number
  /** Total number of files */
  totalFiles: number
  /** Total size of all files in bytes */
  totalSize: number
}