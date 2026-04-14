import React from 'react';
import { useStorage } from '../../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../../services/storage';
import ResourcesTab from '../../../Assignments/components/tabs/ResourcesTab';

const ProjectResourcesTab = ({ project, onUpdate, onActivityAdd }) => {
  return (
    <ResourcesTab 
      entity={{ id: project.id, name: project.name }} 
      onUpdate={onUpdate}
      entityType="Project"
      onActivityAdd={onActivityAdd}
    />
  );
};

export default ProjectResourcesTab;

