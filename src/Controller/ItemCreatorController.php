<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Controller;

use SilentSpirits\ItemCreator\Domain\Item;
use SilentSpirits\ItemCreator\Export\ItemCsvExporter;
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
        'getitemtypesds' => ['GET', 'getItemTypesDS'],
        'getallitems' => ['GET', 'getAllItems'],
        'getitem' => ['GET', 'getItem'],
        'createitem' => ['POST', 'createItem'],
        'updateitem' => ['PUT', 'updateItem'],
        'deleteitem' => ['DELETE', 'deleteItem'],
        // GET keeps the C# contract (?item=<json>); POST avoids URL length limits for big items.
        'exportitemtocvs' => [['GET', 'POST'], 'exportItemToCsv'],
    ];

    /**
     * @param \Closure(): LookupRepository $lookups
     * @param \Closure(): ItemRepository $items
     */
    public function __construct(
        private \Closure $lookups,
        private \Closure $items,
        private bool $allowWrites
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

    /** Item categories (itemtype rows). New ones are added by saving an item with a new category. */
    public function getItemTypesDS(Request $request): Response
    {
        return Response::json(($this->lookups)()->itemTypes());
    }

    /**
     * Public items only, unless writes are on: then anyone can already edit or delete any
     * item, so hiding the private ones protects nothing, and new items (IsPublic = 0) need
     * to show up in the Inventory panel to be loaded again.
     */
    public function getAllItems(Request $request): Response
    {
        return Response::json(($this->items)()->listItems($this->allowWrites));
    }

    public function getItem(Request $request, string ...$rest): Response
    {
        $id = $this->requireId($request, $rest);
        $item = ($this->items)()->find($id);
        if ($item === null) {
            throw HttpException::notFound("No item with ID '$id'.");
        }
        return Response::json($item->toArray());
    }

    public function createItem(Request $request): Response
    {
        $this->assertWritesAllowed();
        $item = Item::fromArray($request->jsonPayload('Item'));
        $item->assertSavable();

        $item->itemId = ($this->items)()->create($item);
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

        if (!($this->items)()->update($item)) {
            throw HttpException::notFound("No item with ID '$item->itemId'.");
        }
        return Response::json($item->toArray());
    }

    public function deleteItem(Request $request, string ...$rest): Response
    {
        $this->assertWritesAllowed();
        $id = $this->requireId($request, $rest);
        if (!($this->items)()->delete($id)) {
            throw HttpException::notFound("No item with ID '$id'.");
        }
        return Response::noContent();
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
    private function assertWritesAllowed(): void
    {
        if (!$this->allowWrites) {
            throw HttpException::forbidden('Saving items is disabled on this server.');
        }
    }
}
