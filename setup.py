from setuptools import setup, find_packages
from pathlib import Path

# Read README
readme_path = Path(__file__).parent / "CLONEKING_README.md"
if readme_path.exists():
    with open(readme_path, "r", encoding="utf-8") as fh:
        long_description = fh.read()
else:
    long_description = "CloneKing - AI Persona Cloning Platform"

# Read requirements (filter out comments and empty lines)
with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = []
    for line in fh:
        line = line.strip()
        if line and not line.startswith("#"):
            requirements.append(line)

setup(
    name="cloneking",
    version="1.0.0",
    author="CloneKing Team",
    description="CloneKing - AI Persona Cloning Platform for creating, training, and managing AI personas",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: End Users/Desktop",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Multimedia :: Sound/Audio :: Speech",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0",
            "black>=23.0",
            "flake8>=6.0",
            "mypy>=1.0",
        ],
        "gpu": [
            "torch[gpu]>=2.0.0",
            "torchaudio[gpu]>=2.0.0",
        ]
    },
    entry_points={
        "console_scripts": [
            "cloneking=cloneking_main:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["assets/*", "*.md", "*.txt"],
        "src": ["**/*"],
    },
    keywords="ai persona chatbot voice cloning machine-learning nlp tts",
    project_urls={
        "Documentation": "https://github.com/cloneking/cloneking",
        "Source": "https://github.com/cloneking/cloneking",
        "Tracker": "https://github.com/cloneking/cloneking/issues",
    },
)