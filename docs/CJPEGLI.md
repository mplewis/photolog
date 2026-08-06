# cjpegli and OpenEXR Setup

## Problem

cjpegli is the JPEG-XL to JPEG encoder from the jpegli project. cjpegli uses specific versions of OpenEXR and Imath libraries. When Homebrew upgrades these libraries, cjpegli fails to run. The program shows this error:

```
dyld[XXXXX]: Library not loaded: /opt/homebrew/opt/openexr/lib/libOpenEXR-3_2.31.dylib
```

## Solution

If this error occurs, install the matching versions of OpenEXR and Imath.

```bash
# Download and build OpenEXR 3.2.10
curl -L "https://github.com/AcademySoftwareFoundation/openexr/releases/download/v3.2.10/openexr-3.2.10.tar.gz" -o /tmp/openexr-3.2.10.tar.gz
tar -xzf /tmp/openexr-3.2.10.tar.gz -C /tmp

# Download and build Imath 3.1.12
curl -L "https://github.com/AcademySoftwareFoundation/Imath/releases/download/v3.1.12/Imath-3.1.12.tar.gz" -o /tmp/Imath-3.1.12.tar.gz
tar -xzf /tmp/Imath-3.1.12.tar.gz -C /tmp

# First, uninstall existing versions
brew uninstall --ignore-dependencies openexr imath

# Build and install Imath first (OpenEXR depends on it)
mkdir -p /tmp/imath-build
cmake /tmp/Imath-3.1.12 \
  -DCMAKE_INSTALL_PREFIX=/opt/homebrew/Cellar/imath/3.1.12 \
  -DCMAKE_BUILD_TYPE=Release \
  -B /tmp/imath-build
make -C /tmp/imath-build -j$(sysctl -n hw.ncpu) install

# Link Imath libraries
mkdir -p /opt/homebrew/opt/imath/lib
ln -sf /opt/homebrew/Cellar/imath/3.1.12/lib/* /opt/homebrew/opt/imath/lib/

# Build and install OpenEXR against the new Imath
mkdir -p /tmp/openexr-build
cmake /tmp/openexr-3.2.10 \
  -DCMAKE_INSTALL_PREFIX=/opt/homebrew/Cellar/openexr/3.2.10 \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_PREFIX_PATH=/opt/homebrew/Cellar/imath/3.1.12 \
  -B /tmp/openexr-build
make -C /tmp/openexr-build -j$(sysctl -n hw.ncpu) install

# Link OpenEXR libraries
mkdir -p /opt/homebrew/opt/openexr/lib
ln -sf /opt/homebrew/Cellar/openexr/3.2.10/lib/* /opt/homebrew/opt/openexr/lib/
```

## Cause

The cjpegli binary was compiled with these versions:
- OpenEXR 3.2.x
- Imath 3.1.x

Homebrew regularly updates these libraries to newer versions. New versions have different SONAMEs. These new versions are not compatible with the cjpegli binary.

## Long-term Solutions

Use one of these solutions:
1. Build cjpegli from source with current OpenEXR and Imath versions
2. Pin OpenEXR and Imath to specific versions in Homebrew
3. Use a statically compiled cjpegli binary

## Verification

Make sure that cjpegli works correctly.

```bash
cjpegli -h
```

This command shows usage information.
