
# XXX Replace the string "APPLICATION" with the application name in all caps.
# XXX Replace the string "application" with the application's executable name (sans extension).

set( APPLICATION_VERSION_MAJOR 0 )
set( APPLICATION_VERSION_MINOR 0 )
set( APPLICATION_VERSION_PATCH 0 )
set( APPLICATION_VERSION_LABEL dev )

## -------------------------------------------------------------------------- ##

set( APPLICATION_SRC
# XXX Add source files here.
)
source_group( "Source Files" FILES ${APPLICATION_SRC} )

set( APPLICATION_SRC_ALL
    ${APPLICATION_SRC}
# XXX Add other source groups here.
)

set( APPLICATION_HEADERS
# XXX Add header files here.
)
source_group( "Header Files" FILES ${APPLICATION_HEADERS} )

set( APPLICATION_HEADERS_ALL )
    ${APPLICATION_HEADERS}
# XXX Add other source groups here.
)

## -------------------------------------------------------------------------- ##

set( APPLICATION_INCLUDE_PATHS
    ${CMAKE_CURRENT_LIST_DIR}
    ${LW_INCLUDE_PATHS}
# XXX Add include paths here.
)

set( APPLICATION_LIBRARY_PATHS
    ${LW_LIBRARY_PATHS}
# XXX Add library paths here.
)

set( APPLICATION_PACKAGES
    ${LW_PACKAGES}
# XXX Add required packages here.
)

## -------------------------------------------------------------------------- ##

# Set up the build target.
include_directories( ${APPLICATION_INCLUDE_PATHS} )
add_executable( application ${APPLICATION_SRC_ALL} ${APPLICATION_HEADERS_ALL} )
target_link_libraries( application ${APPLICATION_PACKAGES} )

