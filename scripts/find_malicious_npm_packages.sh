#!/bin/zsh

# Dependency Checker
# Searches for specific dependencies and their versions in node_modules/.pnpm directory

# Define dependencies and their versions to search for
typeset -A DEPENDENCIES
DEPENDENCIES["@accordproject/concerto-analysis"]="3.24.1"
DEPENDENCIES["@accordproject/concerto-metamodel"]="3.12.5"
DEPENDENCIES["@accordproject/concerto-types"]="3.24.1"
DEPENDENCIES["@accordproject/markdown-it-cicero"]="0.16.26"
DEPENDENCIES["@ensdomains/address-encoder"]="0.1.5"
DEPENDENCIES["@ensdomains/content-hash"]="3.0.1"
DEPENDENCIES["@ensdomains/dnsprovejs"]="0.5.3"
DEPENDENCIES["@ensdomains/dnssecoraclejs"]="0.2.9"
DEPENDENCIES["@ensdomains/ens-contracts"]="1.6.1"
DEPENDENCIES["@ensdomains/ens-validation"]="0.1.1"
DEPENDENCIES["@ensdomains/ensjs"]="4.0.3"
DEPENDENCIES["@ensdomains/eth-ens-namehash"]="2.0.16"
DEPENDENCIES["@ensdomains/react-ens-address"]="0.0.32"
DEPENDENCIES["ethereum-ens"]="0.8.1"
DEPENDENCIES["@zapier/ai-actions-react"]="0.1.12 0.1.13 0.1.14"
DEPENDENCIES["@zapier/mcp-integration"]="3.0.1 3.0.2 3.0.3"
DEPENDENCIES["@zapier/secret-scrubber"]="1.1.3 1.1.4 1.1.5"
DEPENDENCIES["@zapier/stubtree"]="0.1.2 0.1.3 0.1.4"
DEPENDENCIES["@zapier/zapier-sdk"]="0.15.5 0.15.6 0.15.7"
DEPENDENCIES["zapier-platform-cli"]="18.0.2 18.0.3 18.0.4"
DEPENDENCIES["zapier-platform-core"]="18.0.2 18.0.3 18.0.4"
DEPENDENCIES["zapier-platform-schema"]="18.0.2 18.0.3 18.0.4"
DEPENDENCIES["zapier-scripts"]="7.8.3 7.8.4"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "Searching for dependencies in node_modules/.pnpm directory..."
echo "================================================"
echo ""

# Counter for found dependencies
FOUND_COUNT=0

# Check if node_modules/.pnpm directory exists
if [ ! -d "node_modules/.pnpm" ]; then
    echo "node_modules/.pnpm directory not found."
    exit 0
fi

# Function to check if version matches
version_matches() {
    local installed_version="$1"
    local target_versions="$2"
    
    # Check if the installed version matches any of the target versions
    for target_version in $target_versions; do
        if [ "$installed_version" = "$target_version" ]; then
            return 0
        fi
    done
    return 1
}

# Function to parse package name and version from directory name
# Format: package@version or @scope+package@version or package@version_peer@version
parse_package_info() {
    local dir_name="$1"
    local package_name=""
    local package_version=""
    
    # Remove everything after first underscore (peer dependencies)
    local base_name="${dir_name%%_*}"
    
    # Check if it's a scoped package (starts with @)
    if [[ "$base_name" =~ ^@ ]]; then
        # Scoped package: @scope+package@version
        # Extract scope (everything before +)
        local scope="${base_name%%+*}"
        # Extract package and version (everything after +)
        local rest="${base_name#*+}"
        # Extract package name (everything before @)
        local pkg="${rest%%@*}"
        # Extract version (everything after @)
        package_version="${rest#*@}"
        package_name="$scope/$pkg"
    else
        # Regular package: package@version
        package_name="${base_name%%@*}"
        package_version="${base_name#*@}"
    fi
    
    echo "$package_name|$package_version"
}

# Iterate over all directories in node_modules/.pnpm
for pnpm_dir in node_modules/.pnpm/*; do
    # Skip if not a directory
    if [ ! -d "$pnpm_dir" ]; then
        continue
    fi
    
    # Get the directory name (without path)
    dir_name=$(basename "$pnpm_dir")
    
    # Parse package name and version
    package_info=$(parse_package_info "$dir_name")
    if [ -z "$package_info" ] || [ "$package_info" = "|" ]; then
        continue
    fi
    
    # Split package_info into name and version
    package_name="${package_info%%|*}"
    package_version="${package_info##*|}"
    
    # Check if this package is in our dependencies list
    for dep_name_quoted in "${(@k)DEPENDENCIES}"; do
        # Remove surrounding quotes from the key
        dep_name="${dep_name_quoted%\"}"
        dep_name="${dep_name#\"}"
        target_versions="${DEPENDENCIES[$dep_name_quoted]}"
        
        # Check if package name matches
        if [ "$package_name" = "$dep_name" ]; then
            # Check if version matches
            if version_matches "$package_version" "$target_versions"; then
                echo -e "${GREEN}✓${NC} Found: ${BLUE}$dep_name${NC} @ $package_version"
                echo "  Location: $pnpm_dir"
                echo ""
                FOUND_COUNT=$((FOUND_COUNT + 1))
            fi
        fi
    done
done

echo "================================================"
echo "Total matching dependencies found: $FOUND_COUNT"
