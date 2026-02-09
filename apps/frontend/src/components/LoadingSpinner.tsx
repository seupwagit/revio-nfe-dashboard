interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function LoadingSpinner({ size = 'md', showText = true }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${showText ? 'py-12' : 'py-0'}`}>
      <div className="relative">
        <div className={`${sizes[size]} border-revio-light rounded-full`}></div>
        <div className={`${sizes[size]} border-revio-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
      </div>
      {showText && <p className="mt-4 text-sm font-medium text-revio-gray-600">Carregando...</p>}
    </div>
  )
}
