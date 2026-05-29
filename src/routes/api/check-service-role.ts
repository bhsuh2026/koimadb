import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/check-service-role')({
  server: {
    handlers: {
      GET: async () => {
        console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY)
        return new Response('OK — check server console/logs for the key value', { status: 200 })
      }
    }
  }
})
