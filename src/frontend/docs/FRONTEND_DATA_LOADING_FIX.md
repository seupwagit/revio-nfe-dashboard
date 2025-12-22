# 🔧 Fix: Frontend Data Loading Issue

## 🐛 Problem

Frontend was showing empty data (0 documents) even though the backend API was working correctly and returning 5200 documents.

## 🔍 Root Cause

**Parameter Name Mismatch** between frontend and backend:

### Frontend was sending:
- `dataInicio` and `dataFim` for date range
- `pageSize` for pagination size

### Backend was expecting:
- `dtIni` and `dtFim` for date range
- `size` for pagination size

### Response Structure Mismatch:
- Frontend expected: `{ data: [], page, totalPages, total }`
- Backend returned: `{ success: true, data: [], pagination: { page, size, total, totalPages }, executionTime }`

## ✅ Solution

### 1. Fixed Parameter Mapping in `fiscalDocuments.ts`

Changed parameter names to match backend expectations:

```typescript
// Before
params.append('dataInicio', dataInicio);
params.append('dataFim', dataFim);
params.append('pageSize', pageSize.toString());

// After
params.append('dtIni', dataInicio);
params.append('dtFim', dataFim);
params.append('size', pageSize.toString());
```

### 2. Updated Response Interface

Updated `DocumentsResponse` interface to match backend structure:

```typescript
interface DocumentsResponse {
  success: boolean;
  data: DocumentoFiscal[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  executionTime: number;
}
```

### 3. Fixed Response Data Extraction

Updated data extraction to use the correct nested structure:

```typescript
// Before
return response.data?.data || [];

// After (same, but now response.data has correct structure)
return response.data?.data || [];
```

### 4. Added Debug Logging

Added comprehensive debug logging to help diagnose issues:

- Request parameters
- Authentication token presence
- HTTP request details
- Response structure
- Data extraction steps

## 🧪 Testing

To verify the fix works:

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Login to the application**
4. **Navigate to documents page**
5. **Check console logs** for:
   - `🔍 DEBUG: Fazendo requisição para: /api/documents?...`
   - `🔑 DEBUG: Token de autenticação: ...`
   - `📊 DEBUG: Response do httpService: ...`
   - `📊 DEBUG: Dados recebidos da API: { quantidade: 5200, ... }`

## 📋 Files Modified

- `src/frontend/services/fiscalDocuments.ts` - Fixed parameter mapping and response handling
- `src/frontend/contexts/NFContext.tsx` - Added debug logging
- `src/frontend/services/httpService.ts` - Added debug logging

## 🎯 Expected Behavior

After the fix:
- ✅ Frontend sends correct parameter names to backend
- ✅ Backend processes request successfully
- ✅ Frontend receives and parses response correctly
- ✅ Documents are displayed in the UI
- ✅ Count shows correct total (5200 documents)

## 🔍 Debug Commands

If issues persist, run these in browser console:

```javascript
// Check authentication token
localStorage.getItem('revio_auth_token')

// Manual API test
fetch('http://localhost:3001/api/documents?collection=tbl_nfe_100&page=1&size=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('revio_auth_token')}`
  }
}).then(r => r.json()).then(console.log)
```

## 📝 Notes

- Backend API was working correctly all along
- Issue was purely in frontend parameter mapping
- Debug logs can be removed after confirming fix works
- Authentication token is properly included in requests
