import { useState, useEffect } from 'react';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AppsTab');

interface App {
  id: string;
  name: string;
  description?: string;
  framework?: string;
  template?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppCardProps {
  app: App;
  onSelect: (app: App) => void;
  onDelete: (appId: string) => void;
  isSelected?: boolean;
}

function AppCard({ app, onSelect, onDelete, isSelected }: AppCardProps) {
  return (
    <div 
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected 
          ? 'border-bolt-elements-primary bg-bolt-elements-primary/10' 
          : 'border-bolt-elements-borderColor hover:border-bolt-elements-primary/50'
      }`}
      onClick={() => onSelect(app)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:app-window w-5 h-5 text-bolt-elements-primary" />
            <h3 className="font-semibold text-bolt-elements-textPrimary">{app.name}</h3>
            {app.framework && (
              <span className="px-2 py-1 text-xs bg-bolt-elements-surface-2 rounded text-bolt-elements-textSecondary">
                {app.framework}
              </span>
            )}
          </div>
          {app.description && (
            <p className="text-sm text-bolt-elements-textSecondary mb-2">{app.description}</p>
          )}
          <div className="text-xs text-bolt-elements-textTertiary">
            Created: {new Date(app.createdAt).toLocaleDateString()}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(app.id);
          }}
          className="p-1 text-bolt-elements-textTertiary hover:text-red-500 transition-colors"
        >
          <div className="i-ph:trash w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface CreateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (appData: { name: string; description: string; framework: string; template: string }) => void;
}

function CreateAppModal({ isOpen, onClose, onCreate }: CreateAppModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    framework: 'react',
    template: 'blank',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreate(formData);
      setFormData({ name: '', description: '', framework: 'react', template: 'blank' });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bolt-elements-surface-1 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-bolt-elements-textPrimary mb-4">Create New App</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
              App Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-bolt-elements-surface-2 border border-bolt-elements-borderColor rounded focus:outline-none focus:border-bolt-elements-primary"
              placeholder="My Awesome App"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-bolt-elements-surface-2 border border-bolt-elements-borderColor rounded focus:outline-none focus:border-bolt-elements-primary resize-none"
              rows={3}
              placeholder="What does your app do?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
              Framework
            </label>
            <select
              value={formData.framework}
              onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
              className="w-full px-3 py-2 bg-bolt-elements-surface-2 border border-bolt-elements-borderColor rounded focus:outline-none focus:border-bolt-elements-primary"
            >
              <option value="react">React</option>
              <option value="vue">Vue</option>
              <option value="svelte">Svelte</option>
              <option value="vanilla">Vanilla JS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
              Template
            </label>
            <select
              value={formData.template}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              className="w-full px-3 py-2 bg-bolt-elements-surface-2 border border-bolt-elements-borderColor rounded focus:outline-none focus:border-bolt-elements-primary"
            >
              <option value="blank">Blank Project</option>
              <option value="todo">Todo App</option>
              <option value="blog">Blog</option>
              <option value="dashboard">Dashboard</option>
              <option value="ecommerce">E-commerce</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-bolt-elements-textSecondary border border-bolt-elements-borderColor rounded hover:bg-bolt-elements-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-bolt-elements-primary text-white rounded hover:bg-bolt-elements-primary/90 transition-colors"
            >
              Create App
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AppsTab() {
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for development - in production this would come from the PersonalizationService
  useEffect(() => {
    // Simulate loading apps
    setApps([
      {
        id: '1',
        name: 'My Portfolio',
        description: 'Personal portfolio website with React',
        framework: 'react',
        template: 'blog',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
      },
      {
        id: '2',
        name: 'Task Manager',
        description: 'Simple todo application',
        framework: 'vue',
        template: 'todo',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-18T12:15:00Z',
      },
    ]);
  }, []);

  const handleCreateApp = async (appData: { name: string; description: string; framework: string; template: string }) => {
    setLoading(true);
    try {
      // In production, this would call the PersonalizationService
      const newApp: App = {
        id: Date.now().toString(),
        ...appData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setApps([newApp, ...apps]);
      logger.info('Created new app:', newApp.name);
    } catch (error) {
      logger.error('Failed to create app:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    if (confirm('Are you sure you want to delete this app?')) {
      setLoading(true);
      try {
        setApps(apps.filter(app => app.id !== appId));
        if (selectedApp?.id === appId) {
          setSelectedApp(null);
        }
        logger.info('Deleted app:', appId);
      } catch (error) {
        logger.error('Failed to delete app:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartChat = (app: App) => {
    // In production, this would navigate to the chat with the app context
    logger.info('Starting chat for app:', app.name);
    // For now, just show an alert
    alert(`Starting personalized chat for "${app.name}". This will remember your app's context and preferences!`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-bolt-elements-textPrimary mb-2">My Apps</h2>
          <p className="text-bolt-elements-textSecondary">
            Manage your personalized AI apps. Each app maintains its own context and learning history.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-bolt-elements-primary text-white rounded hover:bg-bolt-elements-primary/90 transition-colors disabled:opacity-50"
        >
          <div className="i-ph:plus w-4 h-4" />
          New App
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-12">
          <div className="i-ph:app-window w-16 h-16 text-bolt-elements-textTertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">No apps yet</h3>
          <p className="text-bolt-elements-textSecondary mb-4">
            Create your first personalized AI app to get started
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 bg-bolt-elements-primary text-white rounded hover:bg-bolt-elements-primary/90 transition-colors"
          >
            Create Your First App
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onSelect={setSelectedApp}
              onDelete={handleDeleteApp}
              isSelected={selectedApp?.id === app.id}
            />
          ))}
        </div>
      )}

      {selectedApp && (
        <div className="bg-bolt-elements-surface-1 rounded-lg p-6 border border-bolt-elements-borderColor">
          <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">
            App Details: {selectedApp.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-bolt-elements-textPrimary mb-2">Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-bolt-elements-textSecondary">Framework:</span>
                  <span className="ml-2 text-bolt-elements-textPrimary">{selectedApp.framework}</span>
                </div>
                <div>
                  <span className="text-bolt-elements-textSecondary">Template:</span>
                  <span className="ml-2 text-bolt-elements-textPrimary">{selectedApp.template}</span>
                </div>
                <div>
                  <span className="text-bolt-elements-textSecondary">Created:</span>
                  <span className="ml-2 text-bolt-elements-textPrimary">
                    {new Date(selectedApp.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-bolt-elements-textSecondary">Updated:</span>
                  <span className="ml-2 text-bolt-elements-textPrimary">
                    {new Date(selectedApp.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-bolt-elements-textPrimary mb-2">Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleStartChat(selectedApp)}
                  className="flex items-center gap-2 px-4 py-2 bg-bolt-elements-primary text-white rounded hover:bg-bolt-elements-primary/90 transition-colors w-full"
                >
                  <div className="i-ph:chat-circle w-4 h-4" />
                  Start Personalized Chat
                </button>
                <button
                  onClick={() => alert('Deploy functionality coming soon!')}
                  className="flex items-center gap-2 px-4 py-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary rounded hover:bg-bolt-elements-surface-2 transition-colors w-full"
                >
                  <div className="i-ph:rocket-launch w-4 h-4" />
                  Deploy App
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateAppModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateApp}
      />
    </div>
  );
}