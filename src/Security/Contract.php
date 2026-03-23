<?php
namespace Tonka\DriftQL\Security;

use App\Models\Permission as ModelPermission;
use App\Models\Role;
use Clicalmani\Foundation\Support\Facades\DB;

abstract class Contract
{
    /**
     * Authorize the user for the requested model and query
     *
     * @return bool
     */
    abstract public function authorize(): bool;

    /**
     * Check if the user has the required permission
     *
     * @param string $role_guid Role guid to check, use '*' to match all user's roles
     * @param string|null $permission Permission to check (ex: 'user.update' or 'guid:111')
     * @return bool
     */
    public function is(string $role_guid = '*', string $permission = '*') : bool
    {
        // 1. Wildcard role management
        if ($role_guid === '*') {
            // IMPORTANT: We retrieve the USER's roles, not all roles from the database.
            $user_roles = DB::table('user_roles')
                            ->join('roles', 'role_id', 'id')
                            ->where('user_id = ?', [auth()->id()])
                            ->get('roles.guid, roles.id, roles.is_admin');

            foreach ($user_roles as $role) {
                if ($this->verifyRolePermission($role, $permission)) {
                    return true;
                }
            }
            
            return false;
        }

        // 2. Managing a specific role
        $role = DB::table('roles')
                    ->where('guid', $role_guid)
                    ->first();

        if (!$role) return false;

        return $this->verifyRolePermission($role, $permission);
    }

    /**
     * Check if the user has all the required permissions
     *
     * @param Role|null $role User role
     * @param string|null $access Access level to check, use '*' to match all access levels
     * @param string|null $permission Permission to check, use 'guid' or 'guid:readwritecreate'
     * @param string|array|null $access_level Access level(s) to check, use 'read', 'write' as bitwise flags. ex: 'read|write|create' => '111', '011', '001', or an array of them
     * @return bool
     */
    public function has(string $role_guid = '*', string $permission = '*', string|array|null $access_level = null) 
    {
        if ($access_level && is_string($access_level)) $access_level = [$access_level];

        if ($access_level) {
            foreach ($access_level as $auth) {
                if (!$this->is($role_guid, "$permission:$auth")) return false;
            }
        } elseif (!$this->is($role_guid, $permission)) return false;

        return true;
    }

    /**
     * Check if the user has at least one of the required permissions
     *
     * @param Role|null $role User role
     * @param string|null $access Access level to check, use '*' to match all access levels
     * @param string|null $permission Permission to check, use 'guid' or 'guid:readwritecreate'
     * @param string|array|null $access_level Access level(s) to check, use 'read', 'write' as bitwise flags. ex: 'read|write|create' => '111', '011', '001', or an array of them
     * @return bool
     */
    public function orHas(?Role $role = null, ?string $access = '*', ?string $perm = '', string|array|null $access_level = null) 
    {
        if ($access_level && is_string($access_level)) $access_level = [$access_level];
        
        if ($access_level) {
            foreach ($access_level as $auth) {
                if ($this->is($role, $access, "$perm:$auth")) return true;
            }
        } elseif ($this->is($role, $access, $perm)) return true;

        return false;
    }

    /**
     * Helper method to check the permissions of a specific role
     */
    private function verifyRolePermission(object $role, string $permission) : bool
    {
        // Super Admin
        if (!empty($role->is_admin)) return true;

        // We parse the requested permission (e.g., 'perm01:101')
        [$perm_guid, $required_flags] = explode(':', $permission);

        $condition = 'role_id = ?';
        $bindings = [$role->id];
        $query = DB::table('roles_permissions')
                    ->join('permissions', 'permission_id', 'id');

        // If we are not looking for a specific permission ("*"), 
        // we are simply checking if the role has permissions.
        if ($perm_guid !== '*') {
            $condition .= ' AND `guid` = ?';
            $bindings[] = $perm_guid;
        }

        $role_perms = $query->where($condition, $bindings)
                        ->get('permissions.guid, roles_permissions.read, roles_permissions.write, roles_permissions.create');

        foreach ($role_perms as $perm) {
            // Case 1: No specific flag requested (e.g., 'perm01' or '*')
            // We simply check if the permission exists (if the user has any rights to it)
            if ($required_flags === null) {
                // If we search for ANY permission (*), and we found an entry, that's good.
                if ($perm_guid === '*') return true;
                
                // If we're looking for a specific permission without a flag (e.g., is('rol01', 'perm01'))
                // This means "Does it have access to posts?" (Read, Write, or Create)
                if ($perm->guid === $perm_guid) {
                    return ($perm->read || $perm->write || $perm->create);
                }
            } 
            // Case 2: Specific flags are required (e.g., 'perm01:101' for Read + Write)
            else {
                if ($perm->guid === $perm_guid || $perm_guid === '*') {
                    // We rebuild the binary mask of the database
                    // (Cast to int to be safe, or string depending on your database)
                    $current_flags = ((int)$perm->read ? '1' : '0') 
                                        . ((int)$perm->write ? '1' : '0') 
                                        . ((int)$perm->create ? '1' : '0');
                    
                    if ($current_flags === $required_flags) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}