const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ariaLabel
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full'

  const variantClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100',
    secondary: 'bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-100',
    success: 'bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-100',
    warning: 'bg-warning-100 dark:bg-warning-900 text-warning-800 dark:text-warning-100',
    danger: 'bg-danger-100 dark:bg-danger-900 text-danger-800 dark:text-danger-100',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return (
    <span
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  )
}

export default Badge
