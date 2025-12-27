# Implementation Plan: RAH Assistant Visibility Control

## Overview

Este plano implementa o controle de visibilidade do RAH - Assistente IA através de um hook customizado, componente de toggle e integração com o StorageService existente. A implementação seguirá uma abordagem incremental, construindo cada componente e testando a funcionalidade core antes de integrar tudo.

## Tasks

- [ ] 1. Create useRAHVisibility hook with storage integration
  - Create custom hook to manage RAH visibility state
  - Integrate with existing StorageService for persistence
  - Implement storage fallback hierarchy (localStorage → sessionStorage → memory)
  - Add error handling for storage failures
  - _Requirements: 1.1, 1.3, 4.1, 4.2, 4.3, 4.5_

- [ ]* 1.1 Write property test for storage hierarchy
  - **Property 2: Persistence hierarchy works correctly**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ]* 1.2 Write property test for storage error handling
  - **Property 9: Storage error handling**
  - **Validates: Requirements 4.5**

- [ ] 2. Create RAHVisibilityToggle component
  - Create toggle component for when RAH is hidden
  - Position in bottom-right corner with appropriate styling
  - Integrate with useRAHVisibility hook
  - Add visual feedback for state changes
  - _Requirements: 2.2, 2.4_

- [ ]* 2.1 Write property test for UI controls availability
  - **Property 4: UI controls availability matches state**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 3. Enhance existing RAHAssistant component
  - Add hide button to RAHAssistant header
  - Integrate with useRAHVisibility hook
  - Implement conditional rendering based on visibility state
  - Ensure no floating button appears when hidden
  - _Requirements: 1.2, 1.5, 2.1_

- [ ]* 3.1 Write property test for toggle functionality
  - **Property 1: Toggle functionality works correctly**
  - **Validates: Requirements 1.2, 2.3, 2.4**

- [ ]* 3.2 Write property test for hidden state rendering
  - **Property 5: Hidden state renders correctly**
  - **Validates: Requirements 1.5**

- [ ] 4. Checkpoint - Ensure basic functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement admin configuration support
  - Add environment variable support for global RAH control
  - Extend useRAHVisibility hook to check admin settings
  - Implement logic to hide user controls when globally disabled
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 5.1 Write property test for global admin control
  - **Property 6: Global admin control overrides user preferences**
  - **Validates: Requirements 3.1**

- [ ]* 5.2 Write property test for global enable with user preferences
  - **Property 7: Global enable respects user preferences**
  - **Validates: Requirements 3.2**

- [ ]* 5.3 Write property test for global disable hiding controls
  - **Property 8: Global disable hides user controls**
  - **Validates: Requirements 3.3**

- [ ] 6. Integrate components in Layout
  - Update Layout.tsx to use conditional RAHAssistant rendering
  - Add RAHVisibilityToggle component when RAH is hidden
  - Ensure proper z-index and positioning
  - _Requirements: 1.4, 2.2_

- [ ]* 6.1 Write property test for persistence across sessions
  - **Property 3: Visibility state persistence across sessions**
  - **Validates: Requirements 1.3, 1.4**

- [ ] 7. Add default visibility example test
  - Write unit test to verify RAH is visible by default for new users
  - Test first-time user experience
  - _Requirements: 1.1_

- [ ] 8. Final integration and testing
  - Test complete user flow: hide → refresh → show → hide
  - Verify all visual feedback works correctly
  - Test error scenarios and fallbacks
  - _Requirements: All_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation leverages existing StorageService infrastructure
- Admin configuration uses environment variables for deployment flexibility