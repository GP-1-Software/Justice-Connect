import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Menu, X, User, LogIn, Search, ChevronDown, Moon, Sun, MessageSquare, LogOut, Settings, UserCircle, LayoutDashboard, Briefcase, Calendar as CalendarIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedSearchType, setSelectedSearchType] = useState('حسب الاسم');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const userMenuRef = useRef(null);

  // Check if user is logged in (you can replace this with actual auth logic)
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setIsLoggedIn(true);
      setUserData(JSON.parse(user));
    }
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserData(null);
    setUserMenuOpen(false);
    navigate('/');
  };

  const searchOptions = ['حسب الاسم', 'حسب الخبرة', 'حسب المدينة', 'حسب القسم'];

  const handleSearchOptionClick = (option) => {
    setSelectedSearchType(option);
    setSearchOpen(false);
    setShowSearchBar(true);
  };

  const handleScroll = (e, targetId) => {
    e.preventDefault();
    
    // Check if we're on the home page
    if (window.location.pathname !== '/') {
      // Navigate to home page with hash
      navigate(`/#${targetId}`);
      setIsOpen(false);
      return;
    }
    
    // If already on home page, scroll to section
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsOpen(false);
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg fixed w-full top-0 z-50 transition-colors duration-300">
      {/* Dark Mode Toggle - Fixed Far Left Corner */}
      <button
        onClick={toggleDarkMode}
        className="fixed left-4 top-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition z-[60] bg-white dark:bg-gray-800 shadow-md"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 space-x-reverse hover:opacity-80 transition">
            <Scale className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold gradient-text">المنصة القانونية</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8 space-x-reverse">
            <a href="#home" onClick={(e) => handleScroll(e, 'home')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-semibold cursor-pointer">الرئيسية</a>
            <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-semibold cursor-pointer">المزايا</a>
            <button 
              onClick={() => navigate('/quick-consultation')}
              className="flex items-center space-x-2 space-x-reverse text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-semibold"
            >
              <MessageSquare className="h-5 w-5" />
              <span>استشارة سريعة</span>
            </button>
            
            {/* Search Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex items-center space-x-2 space-x-reverse text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-semibold"
                aria-label="Open search"
              >
                <Search className="h-5 w-5" />
                <span>بحث عن محامي</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${searchOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {searchOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-50">
                  {searchOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSearchOptionClick(option)}
                      className={`w-full text-right px-4 py-2 hover:bg-blue-50 transition ${
                        selectedSearchType === option ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <a href="#contact" onClick={(e) => handleScroll(e, 'contact')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-semibold cursor-pointer">تواصل معنا</a>
          </div>

          {/* CTA Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4 space-x-reverse">
            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition transform hover:scale-105 font-semibold"
                >
                  <UserCircle className="h-6 w-6" />
                  <span>{userData?.first_name || 'المستخدم'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-slideDown">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">مرحباً،</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {userData?.first_name} {userData?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{userData?.email}</p>
                    </div>

                    {/* Menu Items */}
                    {/* Show Dashboard only for admins */}
                    {(userData?.role === 'admin' || userData?.role === 'super_admin') && (
                      <button
                        onClick={() => {
                          navigate('/admin/dashboard');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-blue-600 dark:text-blue-400 font-semibold"
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        <span>لوحة التحكم</span>
                      </button>
                    )}

                    {/* Lawyer quick links */}
                    {userData?.user_type === 'lawyer' && (
                      <>
                        <button
                          onClick={() => {
                            navigate('/lawyer/dashboard');
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-blue-600 dark:text-blue-400 font-semibold"
                        >
                          <LayoutDashboard className="h-5 w-5" />
                          <span>لوحة المحامي</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/lawyer/cases');
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                        >
                          <Briefcase className="h-5 w-5" />
                          <span>القضايا</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/lawyer/calendar');
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                        >
                          <CalendarIcon className="h-5 w-5" />
                          <span>التقويم</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        // Navigate based on user type
                        if (userData?.user_type === 'client') {
                          navigate('/client/dashboard');
                        } else if (userData?.user_type === 'lawyer') {
                          navigate('/lawyer/dashboard');
                        } else {
                          navigate('/profile');
                        }
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                    >
                      <User className="h-5 w-5" />
                      <span>الملف الشخصي</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/settings');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                    >
                      <Settings className="h-5 w-5" />
                      <span>الإعدادات</span>
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-600 dark:text-red-400"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-blue-600 hover:text-blue-700 transition font-semibold"
                >
                  <LogIn className="h-5 w-5" />
                  <span>تسجيل الدخول</span>
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="flex items-center space-x-2 space-x-reverse px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition transform hover:scale-105 font-semibold"
                >
                  <User className="h-5 w-5" />
                  <span>إنشاء حساب</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              <a href="#home" onClick={(e) => handleScroll(e, 'home')} className="text-gray-700 hover:text-blue-600 transition font-semibold">الرئيسية</a>
              <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="text-gray-700 hover:text-blue-600 transition font-semibold">المزايا</a>
              
              {/* Mobile Search Options */}
              <div className="border-t border-b border-gray-200 py-2">
                <p className="text-sm text-gray-500 px-2 mb-2">بحث عن محامي:</p>
                {searchOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSearchOptionClick(option)}
                    className={`w-full text-right px-4 py-2 hover:bg-blue-50 transition rounded ${
                      selectedSearchType === option ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              
              <a href="#contact" onClick={(e) => handleScroll(e, 'contact')} className="text-gray-700 hover:text-blue-600 transition font-semibold">تواصل معنا</a>
              <button 
                onClick={() => navigate('/login')}
                className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold"
              >
                <LogIn className="h-5 w-5" />
                <span>تسجيل الدخول</span>
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition font-semibold"
              >
                <User className="h-5 w-5" />
                <span>إنشاء حساب</span>
              </button>
            </div>
          </div>
        )}

        {/* Search Bar - Appears when search option is selected */}
        {showSearchBar && (
          <div className="py-4 border-t border-gray-200 animate-slideDown">
            <div className="flex items-center space-x-3 space-x-reverse bg-white rounded-xl shadow-lg p-3 max-w-3xl mx-auto">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`ابحث ${selectedSearchType}...`}
                className="flex-1 outline-none text-gray-700 px-2"
                autoFocus
              />
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                {selectedSearchType}
              </span>
              <button
                onClick={() => setShowSearchBar(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
