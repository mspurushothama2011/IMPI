const Card = ({
  children,
  className = '',
  hover = false,
  elevated = false,
  ariaLabel,
  onClick
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'
  const hoverClasses = hover ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : ''
  const elevationClasses = elevated ? 'shadow-lg' : 'shadow-md'
  const classes = `${baseClasses} ${elevationClasses} ${hoverClasses} ${className}`

  return (
    <div
      className={classes}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({
  children,
  className = '',
  ariaLevel = '2'
}) => {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      {typeof children === 'string' ? (
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white" aria-level={ariaLevel}>
          {children}
        </h2>
      ) : (
        children
      )}
    </div>
  )
}

export const CardBody = ({
  children,
  className = ''
}) => {
  return (
    <div
      className={`px-6 py-4 ${className}`}
    >
      {children}
    </div>
  )
}

export const CardFooter = ({
  children,
  className = ''
}) => {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
