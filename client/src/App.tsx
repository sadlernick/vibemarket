import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import FindProjects from './pages/FindProjects';
import PostProjects from './pages/PostProjects';
import ProjectDetail from './pages/ProjectDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthSuccess from './pages/AuthSuccess';
import GitHubCallback from './pages/GitHubCallback';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import DraftProjects from './pages/DraftProjects';
import AuthorProfile from './pages/AuthorProfile';
import ProjectIdeaGenerator from './pages/ProjectIdeaGenerator';
import BuildYourFirst from './pages/BuildYourFirst';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogAdmin from './pages/BlogAdmin';
import BlogEditor from './pages/BlogEditor';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/find-projects" element={<FindProjects />} />
              <Route path="/post-projects" element={<PostProjects />} />
              <Route 
                path="/edit-project/:id" 
                element={
                  <ProtectedRoute>
                    <PostProjects />
                  </ProtectedRoute>
                } 
              />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/author/:id" element={<AuthorProfile />} />
              <Route path="/tools/idea-generator" element={<ProjectIdeaGenerator />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/success" element={<AuthSuccess />} />
              <Route path="/auth/github/callback" element={<GitHubCallback />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/seller-dashboard" 
                element={
                  <ProtectedRoute>
                    <SellerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/upload" 
                element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/drafts" 
                element={
                  <ProtectedRoute>
                    <DraftProjects />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/blog" 
                element={
                  <ProtectedRoute requireAdmin>
                    <BlogAdmin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/blog/new" 
                element={
                  <ProtectedRoute requireAdmin>
                    <BlogEditor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/blog/edit/:id" 
                element={
                  <ProtectedRoute requireAdmin>
                    <BlogEditor />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  </HelmetProvider>
  );
}

export default App;
