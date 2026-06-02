import { useMemo, useCallback } from 'react';
import {
  getFieldLabel,
  getStepTitle,
  getOptionLabel,
  getMultipleFieldLabels,
  hasCustomMapping,
  autoFormatFieldName,
} from '@/services/fieldMappings.js';

/**
 * Custom hook for field label management with master mapping
 * 
 * @param {string} category - Optional category for context (e.g., 'profile', 'application')
 * @returns {Object} - Helper functions for label management
 */
export const useFieldLabel = (category = 'profile') => {
  /**
   * Get label for a single field
   */
  const getLabel = useCallback(
    (fieldName) => {
      return getFieldLabel(fieldName, category);
    },
    [category]
  );

  /**
   * Get label for step/section title
   */
  const getStep = useCallback((stepId) => {
    return getStepTitle(stepId);
  }, []);

  /**
   * Get label for select option
   */
  const getOption = useCallback((optionValue) => {
    return getOptionLabel(optionValue);
  }, []);

  /**
   * Get multiple labels at once (memoized)
   */
  const getMultipleLabels = useCallback((fieldNames) => {
    return getMultipleFieldLabels(fieldNames);
  }, []);

  /**
   * Check if field has custom mapping
   */
  const hasMapping = useCallback((fieldName) => {
    return hasCustomMapping(fieldName);
  }, []);

  /**
   * Format field name (fallback logic)
   */
  const formatField = useCallback((fieldName) => {
    return autoFormatFieldName(fieldName);
  }, []);

  /**
   * Get label with custom override
   * Allows component-level override of master mapping
   */
  const getLabelWithOverride = useCallback(
    (fieldName, customLabel) => {
      return customLabel || getFieldLabel(fieldName, category);
    },
    [category]
  );

  /**
   * Batch process fields with their labels
   * Useful for rendering multiple fields
   */
  const processFields = useCallback(
    (fields) => {
      if (!Array.isArray(fields)) return [];

      return fields.map((field) => ({
        ...field,
        displayLabel: getFieldLabel(field.name || field.label, category),
        originalLabel: field.label,
        hasMasterMapping: hasCustomMapping(field.name),
      }));
    },
    [category]
  );

  return {
    getLabel,
    getStep,
    getOption,
    getMultipleLabels,
    hasMapping,
    formatField,
    getLabelWithOverride,
    processFields,
  };
};

/**
 * Hook for formatted field display value
 * Handles arrays, booleans, and other data types
 * 
 * @param {any} value - The value to format
 * @param {string} type - Field type (optional)
 * @returns {string} - Formatted display value
 */
export const useFormattedValue = (value, type) => {
  const { getOption } = useFieldLabel();

  return useMemo(() => {
    // Handle null/undefined
    if (value === undefined || value === null || value === '') {
      return 'Not provided';
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Not provided';
      
      // Map options if they're select values
      const mappedValues = value.map(v => getOption(v) || v);
      return mappedValues.join(', ');
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Handle objects
    if (typeof value === 'object') {
      if (Object.keys(value).length === 0) return 'Not provided';
      return JSON.stringify(value);
    }

    // Handle strings - check if it's a select option
    if (typeof value === 'string') {
      const optionLabel = getOption(value);
      return optionLabel !== value ? optionLabel : value;
    }

    // Default: convert to string
    return String(value);
  }, [value, type, getOption]);
};

export default useFieldLabel;