"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiresRoles = void 0;
const common_1 = require("@nestjs/common");
const RequiresRoles = (roles) => (0, common_1.SetMetadata)('roles', roles);
exports.RequiresRoles = RequiresRoles;
