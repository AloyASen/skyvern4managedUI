FROM python:3.11 AS requirements-stage
# Export only runtime dependencies to requirements.txt
WORKDIR /tmp
RUN pip install poetry && poetry self add poetry-plugin-export
COPY ./pyproject.toml /tmp/pyproject.toml
COPY ./poetry.lock /tmp/poetry.lock
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes

FROM python:3.11 AS build-stage
WORKDIR /src
RUN pip install poetry
COPY . /src
# Build a wheel for the application (includes skyvern, alembic, scripts)
RUN poetry build -f wheel && ls -l dist

FROM python:3.11-slim-bookworm AS runtime
WORKDIR /app

# Install Python dependencies
COPY --from=requirements-stage /tmp/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir --upgrade -r requirements.txt

# Install app wheel only (no source tree)
COPY --from=build-stage /src/dist/ /tmp/dist/
RUN pip install --no-cache-dir /tmp/dist/*.whl && rm -rf /tmp/dist

# Playwright and OS deps
RUN playwright install-deps && playwright install
RUN apt-get update && apt-get install -y xauth x11-apps netpbm gpg ca-certificates && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node.js (for Bitwarden CLI)
COPY .nvmrc /app/.nvmrc
COPY nodesource-repo.gpg.key /tmp/nodesource-repo.gpg.key
RUN cat /tmp/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    NODE_MAJOR=$(cut -d. -f1 < /app/.nvmrc) && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" >> /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm /tmp/nodesource-repo.gpg.key && \
    npm -v && node -v

# Install Bitwarden CLI
RUN npm install -g @bitwarden/cli@2024.9.0 && bw --version

# Copy only required runtime files (no source tree)
COPY ./alembic.ini /app/alembic.ini
COPY ./alembic /app/alembic
COPY ./entrypoint-skyvern.sh /app/entrypoint-skyvern.sh
RUN chmod +x /app/entrypoint-skyvern.sh

# Precompile our app code and remove .py sources from our modules and migrations
RUN python - <<'PY'
import importlib, pathlib, compileall, shutil

def compile_legacy(dir_path: pathlib.Path) -> None:
    # Compile to legacy .pyc placed next to modules (not in __pycache__)
    compileall.compile_dir(str(dir_path), force=True, quiet=1, legacy=True)
    # Remove __pycache__ compiled files to avoid confusion
    for d in dir_path.rglob('__pycache__'):
        shutil.rmtree(d, ignore_errors=True)
    # Remove all .py sources
    for py in dir_path.rglob('*.py'):
        py.unlink(missing_ok=True)

for m in ('skyvern','scripts'):
    try:
        pkg = importlib.import_module(m)
        file = getattr(pkg, '__file__', None)
        if not file:
            print(f"skip {m}: missing __file__")
            continue
        p = pathlib.Path(file).resolve().parent
        compile_legacy(p)
    except Exception as e:
        print(f"skip {m}: {e}")

# Alembic: compile to __pycache__ and strip sources (alembic supports sourceless)
compileall.compile_dir('/app/alembic', force=True, quiet=1)
import pathlib
for py in pathlib.Path('/app/alembic').rglob('*.py'):
    py.unlink(missing_ok=True)
PY

# Do not override PYTHONPATH; rely on installed packages in site-packages
ENV VIDEO_PATH=/data/videos
ENV HAR_PATH=/data/har
ENV LOG_PATH=/data/log
ENV ARTIFACT_STORAGE_PATH=/data/artifacts

CMD [ "/bin/bash", "/app/entrypoint-skyvern.sh" ]
