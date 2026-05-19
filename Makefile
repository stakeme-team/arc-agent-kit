# Default mode: native (npm on host).
# Switch to Docker (isolated install) with: make use-docker
MODE ?= native

# Load user overrides BEFORE conditional logic so MODE can be pinned in Makefile.local
-include Makefile.local

DC := docker compose run --rm

ifeq ($(MODE),docker)
RUN := $(DC) dev
INSTALL_CMD := $(DC) install
else
RUN :=
INSTALL_CMD := npm install
endif

.PHONY: help install wallet wallet-secure send deploy sign signer signer-manual security-test sh use-docker use-native

help:
	@echo "Mode: $(MODE)  (set MODE=docker or 'make use-docker' to switch)"
	@echo ""
	@echo "Targets:"
	@echo "  make install         Install npm dependencies"
	@echo "  make wallet          Create simple wallet (.env)"
	@echo "  make wallet-secure   Create encrypted keystore wallet"
	@echo "  make send            Demo: send tokens to a random address"
	@echo "  make deploy          Demo: deploy & verify contract"
	@echo "  make signer          Start signing daemon"
	@echo "  make signer-manual   Start daemon with per-tx approval"
	@echo "  make security-test   Run guard.sh test suite"
	@echo "  make sh              Open a shell in the dev container (docker only)"
	@echo "  make use-docker      Pin Docker mode in Makefile.local"
	@echo "  make use-native      Pin native mode (remove pin)"

install:
	$(INSTALL_CMD)

wallet:
	$(RUN) npm run wallet:simple

wallet-secure:
	$(RUN) npm run wallet:secure

send:
	$(RUN) npm run demo:send

deploy:
	$(RUN) npm run demo:deploy

sign:
	@$(RUN) npx tsx scripts/sign-tx.ts

signer:
	docker compose run --rm signer

signer-manual:
	docker compose run --rm signer npx tsx scripts/signer-daemon.ts --manual

security-test:
	$(DC) security-test

sh:
	$(DC) dev sh

use-docker:
	@touch Makefile.local
	@grep -v '^MODE' Makefile.local > Makefile.local.tmp 2>/dev/null || true
	@echo "MODE := docker" >> Makefile.local.tmp
	@mv Makefile.local.tmp Makefile.local
	@echo "✓ Switched to Docker mode"

use-native:
	@touch Makefile.local
	@grep -v '^MODE' Makefile.local > Makefile.local.tmp 2>/dev/null || true
	@mv Makefile.local.tmp Makefile.local
	@[ -s Makefile.local ] || rm -f Makefile.local
	@echo "✓ Switched to native mode"
