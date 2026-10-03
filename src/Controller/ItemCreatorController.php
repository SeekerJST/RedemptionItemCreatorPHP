<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Controller;

use SilentSpirits\ItemCreator\Domain\Item;
use SilentSpirits\ItemCreator\Export\ItemCsvExporter;
use SilentSpirits\ItemCreator\Export\ItemPdfExporter;
use SilentSpirits\ItemCreator\Http\HttpException;
use SilentSpirits\ItemCreator\Http\Request;
use SilentSpirits\ItemCreator\Http\Response;
use SilentSpirits\ItemCreator\Repository\ItemRepository;
use SilentSpirits\ItemCreator\Repository\LookupRepository;

/**
 * The PHP port of ItemCreatorController.cs. Routes stay the same, so the
 * React client works unchanged: /itemcreator/{action}[/{id}].
 *
 * Every action takes the request plus any path segments after the action name.
 */
final class ItemCreatorController
{
    /**
     * action (lowercase) => [HTTP method, controller method].
     * The *DS actions return raw table rows using the DB column names, as the C# did.
     */
    public const ROUTES = [
        'getitemsizes' => ['GET', 'getItemSizes'],
        'getitemsizesds' => ['GET', 'getItemSizesDS'],
        'getskillsds' => ['GET', 'getSkillsDS'],
        'getitemattributesds' => ['GET', 'getItemAttributesDS'],
        'getattributescaleds' => ['GET', 'getAttributeScaleDS'],
        'getallitems' => ['GET', 'getAllItems'],
        'getitem' => ['GET', 'getItem'],
        'createitem' => ['POST', 'createItem'],
        'updateitem' => ['PUT', 'updateItem'],
        'deleteitem' => ['DELETE', 'deleteItem'],
        // GET keeps the C# contract (?item=<json>); POST avoids URL length limits for big items.
        'exportitemtocvs' => [['GET', 'POST'], 'exportItemToCsv'],
        // The body is the stat block the client builds (client/src/domain/statBlock.js).
        'exportitemtopdf' => ['POST', 'exportItemToPdf'],
    ];

    /**
     * @param \Closure(): LookupRepository $lookups
     * @param \Closure(): ItemRepository $items
     * @param \Closure(): ItemPdfExporter $pdf
     * @param AuthController $auth who's signed in (items belong to accounts)
     */
    public function __construct(
        private \Closure $lookups,
        private \Closure $items,
        private bool $allowWrites,
        private \Closure $pdf,
        private AuthController $auth
    ) {
    }

    /** { "1": "TINY", "2": "SMALL", ... } keyed by ItemSizeID. */
    public function getItemSizes(Request $request): Response
    {
        // Cast to object so the JSON is always a {} map, even if the IDs happen to be 0..n-1.
        return Response::json((object) ($this->lookups)()->itemSizeNames());
    }

    public function getItemSizesDS(Request $request): Response
    {
        return Response::json(($this->lookups)()->itemSizes());
    }

    public function getSkillsDS(Request $request): Response
    {
        return Response::json(($this->lookups)()->skills());
    }

    public function getItemAttributesDS(Request $request): Response
    {
        return Response::json(($this->lookups)()->attributes());
    }

    public function getAttributeScaleDS(Request $request): Response
    {
        return Response::json(($this->lookups)()->attributeScales());
    }

    /**
     * The items the caller may see: public ones (the catalog) for everyone, plus the signed-in
     * user's own private items.
     */
    public function getAllItems(Request $request): Response
    {
        $user = $this->auth->currentUser();
        return Response::json(($this->items)()->listItems($user['id'] ?? null));
    }

    public function getItem(Request $request, string ...$rest): Response
    {
        $id = $this->requireId($request, $rest);
        $item = ($this->items)()->find($id);
        // Someone else's private item is reported as missing, not forbidden: it doesn't leak that it exists.
        if ($item === null || !$this->maySee($item->isPublic, $item->ownerUserId)) {
            throw HttpException::notFound("No item with ID '$id'.");
        }
        return Response::json($item->toArray());
    }

    public function createItem(Request $request): Response
    {
        $this->assertWritesAllowed();
        $user = $this->auth->requireVerifiedUser();
        $item = Item::fromArray($request->jsonPayload('Item'));
        $item->assertSavable();

        $item->itemId = ($this->items)()->create($item, $user['id']);
        return Response::json($item->toArray(), 201);
    }

    public function updateItem(Request $request, string ...$rest): Response
    {
        $this->assertWritesAllowed();
        $item = Item::fromArray($request->jsonPayload('Item'));
        $item->assertSavable();

        // The ID may come from the path, ?id=, or the item body; they must agree.
        $pathId = $rest[0] ?? $request->queryParam('id');
        if ($pathId !== null && $item->itemId !== null && $pathId !== $item->itemId) {
            throw HttpException::badRequest("The ID in the URL ('$pathId') does not match the item's itemID ('$item->itemId').");
        }
        $item->itemId = $pathId ?? $item->itemId;
        if ($item->itemId === null || $item->itemId === '') {
            throw HttpException::badRequest('itemID is required to update an item.');
        }

        if (!($this->items)()->update($item, $this->writer())) {
            throw HttpException::notFound("No item with ID '$item->itemId'.");
        }
        return Response::json($item->toArray());
    }

    public function deleteItem(Request $request, string ...$rest): Response
    {
        $this->assertWritesAllowed();
        $id = $this->requireId($request, $rest);
        if (!($this->items)()->delete($id, $this->writer())) {
            throw HttpException::notFound("No item with ID '$id'.");
        }
        return Response::noContent();
    }

    /** The item's stat block as a PDF page in the corebook's style. Any trailing segment is accepted. */
    public function exportItemToPdf(Request $request, string ...$rest): Response
    {
        $block = $request->jsonPayload('statBlock');
        $pdf = ($this->pdf)()->export($block);

        $name = trim((string) ($block['name'] ?? '')) ?: 'item';
        return Response::download($pdf, 'application/pdf', $name . '.pdf');
    }

    /** The C# route was exportitemtocvs/download; any trailing segment is accepted. */
    public function exportItemToCsv(Request $request, string ...$rest): Response
    {
        $item = Item::fromArray($request->jsonPayload('item'));
        $csv = (new ItemCsvExporter())->export($item, ($this->lookups)()->attributeNames());

        $name = $item->itemName !== '' ? $item->itemName : 'item';
        return Response::download($csv, 'text/csv; charset=utf-8', $name . '.csv');
    }

    /** @param string[] $rest */
    private function requireId(Request $request, array $rest): string
    {
        $id = $rest[0] ?? $request->queryParam('id');
        if ($id === null || $id === '') {
            throw HttpException::badRequest('An item ID is required, e.g. /itemcreator/getitem/{id}.');
        }
        return $id;
    }

    /**
     * There is no authentication yet (the C# had none either). Until there is,
     * production config should set allow_writes => false so the public can't
     * create, overwrite, or delete items.
     */
    /** Public items are for everyone; a private one only for its owner (and admins). */
    private function maySee(bool $isPublic, ?int $ownerUserId): bool
    {
        if ($isPublic) {
            return true;
        }
        $user = $this->auth->currentUser();
        return $user !== null && ($user['role'] === 'admin' || $user['id'] === $ownerUserId);
    }

    /**
     * The verified user making a change, as the repository checks it: their ID, and whether
     * they're an admin (who may change other accounts' private items).
     *
     * @return array{id: int, admin: bool}
     */
    private function writer(): array
    {
        $user = $this->auth->requireVerifiedUser();
        return ['id' => $user['id'], 'admin' => $user['role'] === 'admin'];
    }

    private function assertWritesAllowed(): void
    {
        if (!$this->allowWrites) {
            throw HttpException::forbidden('Saving items is disabled on this server.');
        }
    }
}
