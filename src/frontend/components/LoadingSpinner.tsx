export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-revio-light rounded-full"></div>
        <div className="w-16 h-16 border-4 border-revio-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-revio-gray-600">Carregando...</p>
    </div>
  )
}
