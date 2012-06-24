# Application build script.

# XXX Replace the string "Application" with the actual application name.

cmake_minimum_required( VERSION 2.8.3 )
cmake_policy( VERSION 2.6 )

# Useful for debugging the build.

project( Application )

# Set OS variables usable by C++ preprocessor.
if( ${WIN32} )
    set( LW_BUILD_WIN32 1 )
else()
    set( LW_BUILD_WIN32 0 )
endif()
if( ${UNIX} )
    set( LW_BUILD_UNIX 1 )
else()
    set( LW_BUILD_UNIX 0 )
endif()
if( ${APPLE} )
    set( LW_BUILD_APPLE 1 )
else()
    set( LW_BUILD_APPLE 0 )
endif()

# Set up configurable variables.
if( ${LW_BUILD_WIN32} )
    set( LW_DEFAULT_BOOST_INCLUDE_DIR C:\Boost\include\v1_49_0 )
    set( LW_DEFAULT_BOOST_LIBRARY_DIR C:\Boost\lib )
else()
    set( LW_DEFAULT_BOOST_INCLUDE_DIR /usr/local/include )
    set( LW_DEFAULT_BOOST_LIBRARY_DIR /usr/local/lib )
endif()

set(
    LW_BOOST_INCLUDE_DIR ${LW_DEFAULT_BOOST_INCLUDE_DIR}
    CACHE PATH "Path to the Boost include directory."
)
set(
    LW_BOOST_LIBRARY_DIR ${LW_DEFAULT_BOOST_LIBRARY_DIR}
    CACHE PATH "Path to the Boost compiled libraries directory."
)

# Set some useful shortcuts/variables.
set( LW_COPY        ${CMAKE_COMMAND} -E copy_if_different )
set( LW_COPY_DIR    ${CMAKE_COMMAND} -E copy_directory )
set( LW_INCLUDE_PATHS
    ${LW_BOOST_INCLUDE_DIR}
# XXX Add other include paths.
)
set( LW_LIBRARY_PATHS
    ${LW_BOOST_LIBRARY_DIR}
# XXX Add other library paths.
)
set( LW_PACKAGES
# XXX Add required packages here.
)

# Include the subdirectories.
add_subdirectory( src )

# TODO: Install.
# TODO: Uninstall.

