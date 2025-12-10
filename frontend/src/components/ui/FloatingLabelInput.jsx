import React, { useState, useEffect } from 'react'

const FloatingLabelInput = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  error = false,
  helperText = '',
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  useEffect(() => {
    setHasValue(value !== undefined && value !== null && value !== '')
  }, [value])

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const inputClasses = `
    w-full px-4 py-3 rounded-lg border transition-all duration-200
    bg-white dark:bg-gray-800 
    text-gray-900 dark:text-gray-100
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
    ${error 
      ? 'border-red-500 dark:border-red-400 focus:ring-red-500' 
      : 'border-gray-300 dark:border-gray-600'
    }
    ${className}
  `

  const labelClasses = `
    absolute left-4 transition-all duration-200 pointer-events-none
    ${error 
      ? 'text-red-500 dark:text-red-400' 
      : 'text-gray-500 dark:text-gray-400'
    }
    ${isFocused || hasValue
      ? 'top-2 text-xs'
      : 'top-1/2 transform -translate-y-1/2 text-base'
    }
    ${isFocused && !error ? 'text-primary-600 dark:text-primary-400' : ''}
  `

  return (
    <div className="floating-label-input relative w-full">
      {type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused || hasValue ? placeholder : ''}
          required={required}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused || hasValue ? placeholder : ''}
          required={required}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
      )}
      <label htmlFor={id} className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {helperText && (
        <p className={`mt-1 text-sm ${error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {helperText}
        </p>
      )}
    </div>
  )
}

export default FloatingLabelInput