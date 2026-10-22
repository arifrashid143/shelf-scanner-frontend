/* global process */
import { apiApp } from './api.js'

const PORT = process.env.PORT || 3001

apiApp.listen(PORT, () => {
  console.log(`🚀 Shelf Scanner Backend API running on http://localhost:${PORT}`)
})
