import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GithubAuthProvider, linkWithPopup, signInWithPopup } from 'firebase/auth';
import {
  Github,
  ExternalLink,
  GitBranch,
  GitCommit,
  User,
  Calendar,
  Plus,
  Settings,
  RefreshCw,
  LogOut,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { generateGeminiResponse } from '../../../../services/aiService';
import { auth } from '../../../../services/firebase';
import ReactMarkdown from 'react-markdown';

const GitHubIntegration = ({ project, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [repoUrl, setRepoUrl] = useState(project.repo || '');
  const [branches, setBranches] = useState(project.branches || []);
  const [commits, setCommits] = useState(project.commits || []);
  
  // AI Feature State
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const [userRepos, setUserRepos] = useState([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [showRepoPicker, setShowRepoPicker] = useState(!project.repo);
  const [showAdvanced, setShowAdvanced] = useState(!project.repo);
  const [githubToken, setGithubToken] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('github_token') : null
  );
  const [githubUser, setGithubUser] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('github_user') : null
  );
  const [isFetching, setIsFetching] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const lastSyncedRepoRef = useRef('');

  useEffect(() => {
    setRepoUrl(project.repo || '');
    setBranches(project.branches || []);
    setCommits(project.commits || []);
    setShowRepoPicker(!project.repo);
    setShowAdvanced(!project.repo);
  }, [project.repo, project.branches, project.commits]);

  const fetchGitHubRepos = async (token = githubToken) => {
    if (!token) {
      toast.error('Sign in with GitHub first');
      return;
    }

    setIsLoadingRepos(true);
    try {
      const response = await fetch(
          'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub repo fetch failed (${response.status})`);
      }

      const data = await response.json();
      const formattedRepos = (Array.isArray(data) ? data : []).map((repo) => ({
        name: repo.full_name,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        private: repo.private,
        updatedAt: repo.updated_at,
        description: repo.description || '',
        language: repo.language || '',
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0
      }));

      setUserRepos(formattedRepos);
      if (typeof window !== 'undefined') {
        localStorage.setItem('github_repos', JSON.stringify(formattedRepos));
      }
      if (!project.repo) {
        setShowRepoPicker(true);
        setShowAdvanced(true);
      }
    } catch (error) {
      console.error('[GitHub] Repo fetch error:', error);
      toast.error('Failed to load your GitHub repositories');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (githubToken) {
      const cachedRepos = typeof window !== 'undefined' ? localStorage.getItem('github_repos') : null;
      if (cachedRepos) {
        try {
          setUserRepos(JSON.parse(cachedRepos));
        } catch {
          void 0;
        }
      } else {
        fetchGitHubRepos();
      }
    } else {
      setUserRepos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubToken]);

  const parseRepoInfo = (url) => {
    if (!url.includes('github.com')) return null;
    const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  };

  const handleConnectGitHub = async () => {
    const provider = new GithubAuthProvider();
    provider.addScope('repo');
    provider.addScope('read:user');
    provider.setCustomParameters({ allow_signup: 'true' });

    try {
      const operation = auth.currentUser
        ? linkWithPopup(auth.currentUser, provider)
        : signInWithPopup(auth, provider);

      const result = await operation;
      const credential = GithubAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken || null;
      const githubProfile = result.additionalUserInfo?.profile || {};
      const githubUserName =
        githubProfile.login ||
        githubProfile.name ||
        result.user.displayName ||
        result.user.email?.split('@')[0] ||
        'GitHub User';

      if (!accessToken) {
        throw new Error('GitHub access token was not returned.');
      }

      localStorage.setItem('github_token', accessToken);
      localStorage.setItem('github_user', githubUserName);
      setGithubToken(accessToken);
      setGithubUser(githubUserName);
      setShowAdvanced(true);
      toast.success('GitHub Connected!');
    } catch (error) {
      console.error('[GitHub] Connect error:', error);
      
      // If the GitHub account is already linked to another StudyOS account,
      // Firebase throws 'credential-already-in-use'. We can still extract the 
      // OAuth access token from the error and use it for this session!
      if (error.code === 'auth/credential-already-in-use') {
        const credential = GithubAuthProvider.credentialFromError(error);
        const accessToken = credential?.accessToken;
        
        if (accessToken) {
          const githubUserName = error.customData?.email?.split('@')[0] || 'GitHub User';
          localStorage.setItem('github_token', accessToken);
          localStorage.setItem('github_user', githubUserName);
          setGithubToken(accessToken);
          setGithubUser(githubUserName);
          setShowAdvanced(true);
          toast.success('GitHub Connected (Session Only)');
          return;
        }
      }

      toast.error(error.message || 'Failed to connect GitHub');
    }
  };

  const handleSaveRepo = async () => {
    if (!repoUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub URL');
      return;
    }

    const repoInfo = parseRepoInfo(repoUrl);
    if (!repoInfo) {
      toast.error('Invalid GitHub repository URL');
      return;
    }

    onUpdate({
      ...project,
      repo: repoUrl,
      lastGithubUpdate: new Date().toISOString()
    });
    setIsEditing(false);
    toast.success('Repository saved');

    // Try to fetch data if we have a token
    if (githubToken) {
      await handleFetchRepoData(repoUrl);
    }
  };

  const handleSelectRepo = async (selectedRepo) => {
    setRepoUrl(selectedRepo.url);
    lastSyncedRepoRef.current = selectedRepo.url;
    await onUpdate({
      ...project,
      repo: selectedRepo.url,
      lastGithubUpdate: new Date().toISOString()
    });
    setIsEditing(false);
    setShowRepoPicker(false);
    setShowAdvanced(false);
    toast.success(`Loaded ${selectedRepo.name}`);
    await handleFetchRepoData(selectedRepo.url);
  };

  const activeRepoUrl = repoUrl || project.repo || '';
  const repoInfo = activeRepoUrl ? parseRepoInfo(activeRepoUrl) : null;
  const selectedRepo = userRepos.find((repo) => repo.url === activeRepoUrl) || null;
  const filteredRepos = userRepos.filter((repo) => {
    if (!repoSearch.trim()) return true;
    const q = repoSearch.trim().toLowerCase();
    return (
      repo.name.toLowerCase().includes(q) ||
      repo.description.toLowerCase().includes(q) ||
      repo.language.toLowerCase().includes(q)
    );
  });

  const handleFetchRepoData = useCallback(async (repositoryUrl = activeRepoUrl) => {
    if (!githubToken) {
      toast.error('Not connected to GitHub');
      return;
    }

    if (!repositoryUrl) {
      toast.error('No repository configured');
      return;
    }

    const repoInfo = parseRepoInfo(repositoryUrl);
    if (!repoInfo) {
      toast.error('Invalid repository URL');
      return;
    }

    setIsFetching(true);
    try {
      // Fetch branches
      const branchesResponse = await fetch(
        `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/branches`,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!branchesResponse.ok) {
        toast.error('Failed to fetch branches. Check repository access.');
        setIsFetching(false);
        return;
      }

      const branchesData = await branchesResponse.json();
      const formattedBranches = (Array.isArray(branchesData) ? branchesData : []).map(b => ({
        name: b.name,
        isDefault: b.commit ? false : false,
        lastCommit: b.commit?.sha?.substring(0, 7) || 'unknown',
        lastUpdated: new Date().toISOString()
      }));

      setBranches(formattedBranches);

      // Fetch commits
      const commitsResponse = await fetch(
        `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits?per_page=10`,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!commitsResponse.ok) {
        toast.error('Failed to fetch commits. Check repository access.');
        setIsFetching(false);
        return;
      }

      const commitsData = await commitsResponse.json();
      const formattedCommits = (Array.isArray(commitsData) ? commitsData : []).map(c => ({
        id: c.sha?.substring(0, 7),
        message: c.commit?.message?.split('\n')[0] || 'No message',
        author: c.commit?.author?.name || c.author?.login || 'Unknown',
        date: c.commit?.author?.date || new Date().toISOString(),
        hash: c.sha?.substring(0, 7)
      }));

      setCommits(formattedCommits);

      // Update project with fetched data
      onUpdate({
        ...project,
        branches: formattedBranches,
        commits: formattedCommits,
        lastGithubUpdate: new Date().toISOString()
      });

      toast.success('Repository data updated');
    } catch (error) {
      console.error('[GitHub] Fetch error:', error);
      toast.error('Failed to fetch repository data');
    } finally {
      setIsFetching(false);
    }
  }, [activeRepoUrl, githubToken, onUpdate, project]);

  const generateAiSummary = async () => {
    setIsAiSummarizing(true);
    setAiSummary('');
    
    try {
      // Gather context from Kanban board if it exists
      let taskContext = '';
      if (project.board) {
        const todo = project.board.todo || [];
        const doing = project.board.doing || [];
        taskContext = `\n\nCurrent Tasks:\n- In Progress: ${doing.map(t => t.title).join(', ') || 'None'}\n- Up Next: ${todo.map(t => t.title).slice(0, 3).join(', ') || 'None'}`;
      }

      // Build a detailed prompt based on real commit history and project context
      let prompt = `You are a world-class AI Tech Lead and Code Reviewer. Analyze this project's recent GitHub activity and current context.
Project Name: ${project.name}
${project.description ? `Description: ${project.description}` : ''}
Total Branches: ${branches.length}${taskContext}

Recent Commits (latest first):
`;
      
      const recentCommits = commits.slice(0, 15);
      if (recentCommits.length === 0) {
        prompt += `(No commits found yet.)\n`;
      } else {
        recentCommits.forEach(c => {
          const hash = (c.sha || c.id || c.hash || '').substring(0, 7);
          const msg = c.commit?.message || c.message || 'No message';
          const author = c.commit?.author?.name || c.author?.name || c.author?.login || 'Unknown';
          prompt += `- [${hash}] ${msg} (by ${author})\n`;
        });
      }
      
      prompt += `
Based on this data, write a highly professional, detailed 3-paragraph summary. 
IMPORTANT RULES:
1. If there is very little commit activity (e.g. just an initial commit), DO NOT just state the obvious. Instead, analyze the Project Name, Description, and Tasks to infer what they are building, and provide a detailed Technical Roadmap or Architecture Recommendations for this specific type of project!
2. If there are many commits, analyze the actual code changes, patterns, and velocity. 
3. Always end with 3 specific, actionable "Recommended Next Steps".
4. Format beautifully using Markdown (bold text, lists, and headers). Do not use placeholders.`;

      // Call the real Gemini API
      const fullText = await generateGeminiResponse(prompt);
      
      // Simulate typing effect for the real response
      let currentText = '';
      for (let i = 0; i < fullText.length; i++) {
        currentText += fullText[i];
        setAiSummary(currentText);
        await new Promise(r => setTimeout(r, 10)); // 10ms per character
      }
    } catch (error) {
      toast.error('AI Summary failed: ' + error.message);
      setAiSummary('Error generating summary. Please check your API key and connection.');
    } finally {
      setIsAiSummarizing(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    localStorage.removeItem('github_repos');
    lastSyncedRepoRef.current = '';
    setGithubToken(null);
    setGithubUser(null);
    setUserRepos([]);
    setShowRepoPicker(true);
    setShowAdvanced(true);
    toast.success('Disconnected from GitHub');
  };

  useEffect(() => {
    if (!githubToken || !activeRepoUrl || !repoInfo) {
      return;
    }

    const hasSavedProjectData = (project.branches?.length || 0) > 0 || (project.commits?.length || 0) > 0;
    const alreadySynced = lastSyncedRepoRef.current === activeRepoUrl;

    if (alreadySynced) {
      return;
    }

    lastSyncedRepoRef.current = activeRepoUrl;

    if (!hasSavedProjectData || branches.length === 0 || commits.length === 0) {
      void handleFetchRepoData(activeRepoUrl);
    }
  }, [
    activeRepoUrl,
    branches.length,
    commits.length,
    githubToken,
    handleFetchRepoData,
    project.branches,
    project.commits,
    repoInfo
  ]);

  return (
    <div className="space-y-8">
      {/* Authentication Status */}
      <div className={`border rounded-xl p-4 ${githubToken
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${githubToken ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              <Github size={20} />
            </div>
            <div>
              <h4 className={`font-bold ${githubToken
                ? 'text-green-800 dark:text-green-200'
                : 'text-amber-800 dark:text-amber-200'
              }`}>
                {githubToken ? `Connected as ${githubUser}` : 'Not Connected to GitHub'}
              </h4>
              <p className={`text-sm mt-1 ${githubToken
                ? 'text-green-700 dark:text-green-300'
                : 'text-amber-700 dark:text-amber-300'
              }`}>
                {githubToken
                  ? 'You can now connect repositories and fetch data'
                  : 'Sign in with GitHub to access your repositories'
                }
              </p>
            </div>
          </div>
          {githubToken && (
            <button
              onClick={handleDisconnect}
              className="p-2 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 transition-all"
              title="Disconnect GitHub"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Connect Button (if not authenticated) */}
      {!githubToken && (
        <button
          onClick={handleConnectGitHub}
          className="w-full px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
        >
          <Github size={20} />
          Connect with GitHub
        </button>
      )}

      {/* Repository Summary */}
      {githubToken && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Project Repository</h3>
              <p className="text-sm font-semibold text-slate-500">
                {repoInfo
                  ? 'This project is linked to one active repo'
                  : 'Choose the repo that belongs to this project'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchGitHubRepos}
                disabled={isLoadingRepos}
                className="text-xs font-bold text-primary-500 hover:text-primary-600 disabled:opacity-50"
              >
                {isLoadingRepos ? 'Refreshing...' : 'Refresh Repos'}
              </button>
              <button
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="text-xs font-bold px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {showAdvanced ? 'Hide Advanced' : 'Advanced'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Github size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Selected Repo</p>
                <p className="font-bold text-slate-900 dark:text-white truncate text-sm" title={repoInfo ? `${repoInfo.owner}/${repoInfo.repo}` : 'Not connected'}>
                  {repoInfo ? `${repoInfo.owner}/${repoInfo.repo}` : 'Not connected'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <GitBranch size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Branches</p>
                <p className="font-black text-slate-900 dark:text-white text-lg leading-none">{branches.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <GitCommit size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Commits</p>
                <p className="font-black text-slate-900 dark:text-white text-lg leading-none">{commits.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Calendar size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Last Sync</p>
                <p className="font-bold text-slate-900 dark:text-white truncate text-sm">
                  {project.lastGithubUpdate ? new Date(project.lastGithubUpdate).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {repoInfo ? (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate">
                  {repoInfo.owner}/{repoInfo.repo}
                </p>
                <p className="text-sm text-slate-500 truncate">
                  {selectedRepo?.description || project.repo}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleFetchRepoData}
                  disabled={isFetching}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  {isFetching ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  {showAdvanced ? 'Hide Advanced' : 'Change Repo'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-500">
                {userRepos.length > 0
                  ? `Found ${userRepos.length} repos for ${githubUser}`
                  : 'Loading your GitHub repositories'}
              </p>
              {userRepos.length > 0 && (
                <button
                  onClick={() => setShowAdvanced(true)}
                  className="w-full px-4 py-3 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Pick a Repository
                </button>
              )}
            </div>
          )}

          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Advanced</h4>
                  <p className="text-sm text-slate-500">
                    For developers who want to switch repos or enter a GitHub URL directly.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Manual URL
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Repository Picker</p>
                  <button
                    onClick={() => setShowRepoPicker((prev) => !prev)}
                    className="text-xs font-bold text-primary-500 hover:text-primary-600"
                  >
                    {showRepoPicker ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showRepoPicker && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder="Search your repos..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="grid gap-3 max-h-72 overflow-y-auto pr-1">
                      {filteredRepos.map((repo) => (
                        <button
                          key={repo.url}
                          onClick={() => handleSelectRepo(repo)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            repoUrl === repo.url
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary-200 dark:hover:border-primary-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{repo.name}</p>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {repo.language || 'Code'} {repo.private ? '| Private' : '| Public'}
                                {repo.description ? ` | ${repo.description}` : ''}
                              </p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                              {repo.defaultBranch}
                            </span>
                          </div>
                        </button>
                      ))}
                      {filteredRepos.length === 0 && (
                        <p className="text-sm text-slate-500 py-6 text-center">
                          No repositories match your search.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Repository Modal */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full space-y-6 border border-slate-100 dark:border-slate-800"
          >
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Repository URL</h3>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">GitHub URL</label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-slate-500 mt-2">Example: https://github.com/octocat/Hello-World</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRepo}
                className="flex-1 py-2 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* AI Summary Section */}
      {githubToken && repoInfo && commits.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-500/20 dark:border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10 gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <Sparkles size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  AI Code Review
                  {isAiSummarizing && (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Get an instant, intelligent summary of your project's recent progress.
                </p>
                
                {(aiSummary || isAiSummarizing) && (
                  <div className="mt-4 p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1">
                      <ReactMarkdown>{aiSummary}</ReactMarkdown>
                    </div>
                    {isAiSummarizing && <span className="inline-block w-1.5 h-4 bg-indigo-500 ml-1 animate-pulse align-middle mt-1" />}
                  </div>
                )}
              </div>
            </div>
            
            <div className="shrink-0 flex items-center gap-2">
              {!isAiSummarizing && !aiSummary && (
                <button 
                  onClick={generateAiSummary}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  <Sparkles size={18} />
                  Analyze Progress
                </button>
              )}
              {!isAiSummarizing && aiSummary && (
                <button 
                  onClick={generateAiSummary}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-indigo-500 shadow-sm"
                  title="Regenerate Analysis"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>
          </div>
          
          {/* Decorative background glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
        </div>
      )}

      {/* Branches Section */}
      {githubToken && repoInfo && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <GitBranch size={24} />
              Branches
            </h3>
            <button
              onClick={handleFetchRepoData}
              disabled={isFetching}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>

          {branches.length === 0 ? (
            <button
              onClick={handleFetchRepoData}
              disabled={isFetching}
              className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isFetching ? 'Loading...' : 'Fetch Branches'}
            </button>
          ) : (
            <div className="grid gap-3">
              {branches.map(branch => (
                <motion.div
                  key={branch.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors shrink-0">
                        <GitBranch size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white">{branch.name}</h4>
                          {(branch.name === 'main' || branch.name === 'master') && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest">Default</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          <span className="text-slate-400">commit </span>{branch.lastCommit}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`${repoUrl || project.repo}/tree/${branch.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 p-2.5 rounded-xl text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all"
                      title="View branch on GitHub"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Commits Section */}
      {githubToken && repoInfo && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <GitCommit size={24} />
              Recent Commits
            </h3>
            {activeRepoUrl && (
              <a
                href={`${activeRepoUrl}/commits`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1"
              >
                View All
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          {commits.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No commits yet</p>
          ) : (
            <div className="space-y-3">
              {commits.map((commit, idx) => (
                <motion.div
                  key={commit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group flex items-start justify-between"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex-shrink-0 pt-0.5">
                      <span className="inline-flex w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-black items-center justify-center group-hover:scale-105 transition-transform border border-slate-200 dark:border-slate-700 shadow-sm">
                        {commit.author?.substring(0, 2).toUpperCase() || 'GH'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">
                        {commit.message}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <User size={12} className="text-slate-400" />
                          {commit.author}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(commit.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="font-mono text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-md">
                          {commit.hash}
                        </span>
                      </div>
                    </div>
                  </div>
                  {activeRepoUrl && (
                    <a
                      href={`${activeRepoUrl}/commit/${commit.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                      title="View commit on GitHub"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Help text for unauthenticated users */}
      {!githubToken && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Sign in with GitHub to view and sync your repositories, branches, and commits.
          </p>
        </div>
      )}
    </div>
  );
};

export default GitHubIntegration;
