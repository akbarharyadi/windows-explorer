/**
 * Composable for managing search functionality
 * 
 * This composable provides reactive state and methods for searching
 * through folders and files in the system.
 * 
 * @module useSearch
 */

import { ref, type Ref } from 'vue'
import { api } from '../services/api'
import type { SearchResults } from '../types'

/**
 * Composable function that provides state and methods for search operations
 * 
 * @returns Object containing reactive state and methods for search
 */
export function useSearch() {
  /** Reactive reference to the current search query */
  const searchQuery = ref('')
  /** Reactive reference to the search results */
  const searchResults: Ref<SearchResults | null> = ref(null)
  /** Reactive reference indicating if a search is currently in progress */
  const searching = ref(false)
  /** Reactive reference to any search error */
  const searchError: Ref<string | null> = ref(null)

  /**
   * Performs a search with the current query
   * 
   * Updates the searchResults reactive reference and handles any errors
   */
  async function performSearch() {
    if (!searchQuery.value.trim()) {
      searchResults.value = null
      return
    }

    searching.value = true
    searchError.value = null
    try {
      searchResults.value = await api.search(searchQuery.value.trim())
    } catch (e) {
      searchError.value = e instanceof Error ? e.message : 'Search failed'
      console.error('Search error:', e)
    } finally {
      searching.value = false
    }
  }

  /**
   * Clears the current search query and results
   */
  function clearSearch() {
    searchQuery.value = ''
    searchResults.value = null
    searchError.value = null
  }

  return {
    searchQuery,
    searchResults,
    searching,
    searchError,
    performSearch,
    clearSearch,
  }
}