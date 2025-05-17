import { QueryClient } from '@tanstack/react-query';

// Define the query function for fetching data
export const getQueryFn = () => async ({ queryKey }: { queryKey: unknown[] }) => {
  const [path] = queryKey as [string];
  const response = await fetch(path);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Handle response format from new service-oriented backend
  // Services return { success: true, data: [...] } format
  if (data && typeof data === 'object' && 'success' in data && data.success === true) {
    return data.data;
  }
  
  // Return original data if it doesn't match service format
  return data;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: getQueryFn(),
    },
  },
});

export const apiRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: any
) => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(path, options);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response;
};