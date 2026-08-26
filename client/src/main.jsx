import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/theme.css';
import './styles/globals.css';
import './styles/animations.css';
import './styles/responsive.css';
import AppLayout from './components/layout/AppLayout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CookbooksPage from './pages/Cookbooks.jsx';
import CookbookDetailPage from './pages/CookbookDetailPage.jsx';
import RecipeCreate from './pages/RecipeCreate.jsx';
import RecipeDetailPage from './pages/RecipeDetailPage.jsx';
import RecipeEdit from './pages/RecipeEdit.jsx';
import CookbookCreate from './pages/CookbookCreate.jsx';
import Recipes from './pages/Recipes.jsx';
import GlobalRecipes from './pages/GlobalRecipes.jsx';
import Profile from './pages/Profile.jsx';
import MyRecipes from './pages/MyRecipes.jsx';
import Planning from './pages/Planning.jsx';
import AcceptInvitation from './pages/AcceptInvitation.jsx';
import NotFound from './pages/NotFound.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="cookbooks" element={<CookbooksPage />} />
          <Route path="cookbooks/:cookbookId" element={<CookbookDetailPage />} />
          <Route path="recipes/new" element={<RecipeCreate />} />
          <Route path="recipes/:recipeId" element={<RecipeDetailPage />} />
          <Route path="recipes/:recipeId/edit" element={<RecipeEdit />} />
          <Route path="cookbooks/new" element={<CookbookCreate />} />
          <Route path="recipes" element={<GlobalRecipes />} />
          <Route path="explore" element={<Recipes />} />
          <Route path="profile" element={<Profile />} />
          <Route path="my-recipes" element={<MyRecipes />} />
          <Route path="planning" element={<Planning />} />
          <Route path="invite/:token" element={<AcceptInvitation />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)