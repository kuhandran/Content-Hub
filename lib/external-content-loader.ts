/**
 * Example: How to fetch external content
 * 
 * Usage:
 * const projects = await fetchExternalContent('en', 'data', 'projects')
 * const skills = await fetchExternalContent('es', 'data', 'skills')
 * const config = await fetchExternalContent('en', 'config', 'apiConfig')
 */

export async function fetchExternalContent(
  lang: string,
  folder: 'config' | 'data',
  file: string
) {
  try {
    const response = await fetch(
      `/api/v1/external?lang=${lang}&folder=${folder}&file=${file}`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error(`Error fetching ${file} from ${lang}/${folder}:`, error)
    throw error
  }
}

/**
 * Example usage in React components:
 * 
 * const [projects, setProjects] = useState([])
 * 
 * useEffect(() => {
 *   fetchExternalContent('en', 'data', 'projects')
 *     .then(setProjects)
 *     .catch(err => console.error(err))
 * }, [])
 */
