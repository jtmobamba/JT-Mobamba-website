from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="jtmobamba-mcp",
    version="1.0.0",
    author="JT Mobamba",
    author_email="sdk@jtmobamba.com",
    description="Official JT Mobamba MCP SDK for Python - Connect to JT Mobamba Cloud Database",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/jtmobamba/jtmobamba-mcp-python",
    project_urls={
        "Bug Tracker": "https://github.com/jtmobamba/jtmobamba-mcp-python/issues",
        "Documentation": "https://jtmobamba.com/docs/sdk/python",
    },
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Database",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.25.0",
    ],
    extras_require={
        "async": ["aiohttp>=3.8.0"],
        "dev": ["pytest", "pytest-asyncio", "black", "mypy"],
    },
    keywords="jtmobamba mcp database cloud api sdk nosql sql",
)
